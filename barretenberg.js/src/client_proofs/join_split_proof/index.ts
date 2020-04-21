import { BarretenbergWorker } from '../../wasm/worker';
import { Prover } from '../prover';
import { SinglePippenger } from '../../pippenger';
import { JoinSplitTx } from './join_split_tx';
import { Note } from '../note';
import { Signature } from '../signature';

export class JoinSplitProver {
  constructor(private wasm: BarretenbergWorker, private prover: Prover) {}

  public init() {
    this.wasm.call('join_split__init_proving_key');
  }

  public async encryptNote(note: Note) {
    await this.wasm.transferToHeap(note.toBuffer(), 0);
    await this.wasm.call('join_split__encrypt_note', 0, 100);
    return Buffer.from(await this.wasm.sliceMemory(100, 164));
  }

  public async sign4Notes(notes: Note[], pk: Buffer) {
    const buf = Buffer.concat(notes.map(n => n.toBuffer()));
    await this.wasm.transferToHeap(pk, 0);
    await this.wasm.transferToHeap(buf, 32);
    await this.wasm.call('join_split__sign_4_notes', 32, 0, 0);
    const sig = Buffer.from(await this.wasm.sliceMemory(0, 64));
    return new Signature(sig.slice(0, 32), sig.slice(32, 64));
  }

  public async createJoinSplitProof(tx: JoinSplitTx) {
    const buf = tx.toBuffer();
    const mem = await this.wasm.call('bbmalloc', buf.length);
    await this.wasm.transferToHeap(buf, mem);
    const proverPtr = await this.wasm.call('join_split__new_prover', mem, buf.length);
    await this.wasm.call('bbfree', mem);
    const proof = await this.prover.createProof(proverPtr);
    await this.wasm.call('create_note__delete_prover', proverPtr);
    return proof;
  }
}

export class JoinSplitVerifier {
  private wasm: BarretenbergWorker;

  constructor(private pippenger: SinglePippenger) {
    this.wasm = pippenger.getWorker();
  }

  public async init(g2Data: Uint8Array) {
    await this.wasm.transferToHeap(g2Data, 0);
    await this.wasm.call('join_split__init_verification_key', this.pippenger.getPointer(), 0);
  }

  public async verifyProof(proof: Buffer) {
    const proofPtr = await this.wasm.call('bbmalloc', proof.length);
    await this.wasm.transferToHeap(proof, proofPtr);
    const verified = (await this.wasm.call('join_split__verify_proof', proofPtr, proof.length)) ? true : false;
    await this.wasm.call('bbfree', proofPtr);
    return verified;
  }
}