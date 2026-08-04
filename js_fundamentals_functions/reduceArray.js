const reduce = function (nums, fn, init) {
    let val = init;

    for (let i = 0; i < nums.length; i++) {
        val = fn(val, nums[i]);
    }

    return val;
};

const nums = [1, 2, 3, 4];

function sum(accum, curr) {
    return accum + curr;
}

console.log(reduce(nums, sum, 0)); // 10