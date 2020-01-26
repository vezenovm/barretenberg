#pragma once

#include "../g1.hpp"

namespace barretenberg
{
// simple helper functions to retrieve pointers to pre-allocated memory for the scalar multiplication algorithm.
// This is to eliminate page faults when allocating (and writing) to large tranches of memory.
namespace scalar_multiplication {

struct accumulator_temporary {
    // fq::field_t temporaries[3];
    g1::affine_element p1;
    fq::field_t x2_plus_x1;
};
struct old_affine_product_runtime_state {
    g1::affine_element* points;
    g1::affine_element* point_pairs_1;
    g1::affine_element* point_pairs_2;
    accumulator_temporary* accumulators;
    fq::field_t* scratch_space;
    uint32_t* bucket_counts;
    uint32_t* bit_offsets;
    uint64_t* point_schedule;
    uint32_t num_points;
    uint32_t num_buckets;
    bool* bucket_empty_status;
};

struct affine_product_runtime_state {
    g1::affine_element* points;
    g1::affine_element* output;
    accumulator_temporary* accumulators;
    uint32_t* bucket_counts;
    uint32_t* bit_offsets;
    uint64_t* point_schedule;
    uint32_t num_points;
    uint32_t num_buckets;
    bool* bucket_empty_status;
};


} // namespace scalar_multiplication
namespace mmu
{
    bool* get_skew_pointer();

    uint64_t* get_wnaf_pointer();

    g1::element* get_bucket_pointer();


    scalar_multiplication::affine_product_runtime_state get_affine_product_runtime_state(const size_t num_threads, const size_t thread_index);
}
}