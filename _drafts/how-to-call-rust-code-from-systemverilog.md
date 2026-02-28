---
layout: post
title: "How to Call Rust Code from SystemVerilog"
date: 2020-11-07
---
The SystemVerilog Direct Programming Interface (DPI), at a high level, provides remote procedure calls in SystemVerilog. The entirety of the DPI's definition can be read in the [SystemVerilog IEEE standard](https://ieeexplore.ieee.org/document/8299595) (requires an account to access). Since SystemVerilog is quite a limiting language compared to general-purpose programming languages, being able to do remote procedure calls is an insanely powerful feature. However, it is commonly misunderstood that the DPI only allows users to call C functions. While that is how it is defined in the SystemVerilog standard, that is actually _not true_ — you can call virtually any code from the SystemVerilog DPI, provided that the compiler can link the functions like they are C functions. This article will demonstrate how you can do that with Rust.

Note that the DPI not only allows RPCs in SystemVerilog, but it also allows RPCs _from_ SystemVerilog in other general purpose languages. I won't cover the latter case, because I find there to be very few cases where you should call SystemVerilog code in another language. If you know of some practical use-cases, message me on [Twitter](https://www.twitter.com/@sean_mclough) and let me know — I would be very interested in hearing your experiences.

# How the DPI Normally Works

Let me provide a brief overview of how the DPI normally works, with C. I will be using Synopsys VCS as the compiler/simulator, since it is an industry-standard tool and it is the only simulator that I have access to. Sorry, [Icarus Verilog](https://github.com/steveicarus/iverilog), but I don't think you even support DPI calls.

A simple DPI function bridge looks like this:

```
// my_function.c
extern "C" void my_function() {
    printf("Hello, world!");
}// my_import.sv
import "DPI" void my_function();

task run_phase();
    my_function();  // When run, will print "Hello, world!"
endtask
```

As the comments above allude, when calling the function `my_function` in SystemVerilog, it ought to print the string `"Hello, world!"`. The difficult part now is linking the C code with SystemVerilog. To do this, you'll need to generate a shared object of the C code. [A quick Google search reveals how this is done](https://www.gnu.org/software/libtool/manual/html_node/Creating-object-files.html), for those who are unfamiliar:

```
$ gcc -c my_function.c
$ gcc -g -O -c my_function.c -fPIC -DPIC -o my_function.o
```

Now we have a shared object file that VCS can link with SystemVerilog. VCS has an unholy amount of flags, but I've found the following to work for linking. If you know how to do this simpler, please let me know.

```
vcs -cc /usr/bin/gcc -ld /usr/bin/g++ -cpp /usr/bin/g++ -LDFLAGS "-L<folder_of_object_file> -l<object_name> -Wl,-E -Wl,-rpath-link,<folder_of_object_file> -Wl,-rpath=<folder_of_object_file> <systemverilog_file_to_compile>
```

The `<object_name>` above should be a subset of the object file's name. Namely, the object file should be named `lib<object_name>.so`. So just use that substring.

That whole command line is kind of a mouthful. However, when we execute `./simv` after compiling with VCS, we are greeted with `"Hello, world!"`. Great!

# Beyond C

If we want to build reusable, maintainable test-benches and RTL with SystemVerilog, we shouldn't limit ourselves to C. We should try to use the programming languages that make our lives as easy as possible. Luckily, with VCS, you actually are not required to use C for DPI calls. As long as you are able to create C-like headers for the functions you are calling with the DPI, you are able to use _any_ language you want. Note that I haven't tried this with any other major compilers besides VCS, but I would assume that it is the same behavior.

I can showcase this feature by creating a library with a single function in Rust, and calling that function in SystemVerilog. We can start with creating a new library crate:

```
cargo new dpi_fns --lib
```

Now, the `Cargo.toml` file needs to be updated to specify that this is a dynamic library you're creating. Add the following section to the file:

```
[lib]
name = "dpi_fns"
crate-type = ["dylib"]
```

All this is doing is making our library a dynamic library — when it is compiled, it will create a shared object in the `target` directory of the crate. Now, let's create the functions that we can call through the DPI in `src/lib.rs`:

```
#[no_mangle]
fn import_me() {
    println!("Hello from Rust!");
}
```

The `#[no_mangle]` attribute is required. As the name implies, this disables Rust's name-mangling and ensures that the symbol in the object file is named the same as its identifier. This ensures that we can use the DPI to call the function with the same name as in Rust. It's similar to how `extern "C"` is used to link C code with the DPI.

To generate the `.so` file, just run `cargo build --release`. Debug builds with cargo do _not_ generate the `.so` file in my experience, so `--release` is required. The `.so` file should be located in `target/release`.

On the Rust side of things, it's as simple as that! Now all we have to do is import and call the function in SystemVerilog:

```
import "DPI-C" function void import_me();

task main();
    import_me();
endtask
```

And link the `.so` file with VCS, as I explained with the command line previously.

```
vcs -cc /usr/bin/gcc -ld /usr/bin/g++ -cop /usr/bin/g++ -LDFLAGS "-L~/dpi_fns/target/release -ldpi_fns -Wl,-E -Wl,-rpath-link,~/dpi_fns/target/release -Wl,-rpath=~/dpi_fns/target/release ~/dpi_fns_sv/dpi_fns_sv.sv
```

Run the `simv` that VCS generated, and voila! You successfully called Rust code from SystemVerilog!

# Performance

One unfortunate truth about the DPI is that subsequent calls to DPI functions incur a performance penalty. I wanted to test to see how much of a penalty this would incur. In order to do this, I needed to benchmark running the `simv` executable against a benchmark in some other language.

For this comparison, the benchmark was a [Monte-Carlo simulation to estimate pi](https://www.geeksforgeeks.org/estimating-value-pi-using-monte-carlo/). This algorithm was written in Rust, with a subroutine to be called in a loop by Rust, and by a DPI function.

Here is the Rust:

```rust
extern crate rand;
use rand::Rng;

fn monte_carlo_calc_pi(num_iter: u32) -> f64 {
    let mut circle_points: u32 = 0;
    let square_points: u32 = num_iter;
    for _ in 0..num_iter {
        circle_points = monte_carlo_subroutine(circle_points);
    }
    let pi: f64 = 4.0 * (circle_points as f64 / square_points as f64);
    return pi;
}

// This function is also called through the DPI
#[no_mangle]
fn monte_carlo_subroutine(mut circle_points: u32) -> u32 {
    let x: f64 = rand::thread_rng().gen_range(-1.0, 1.0);
    let y: f64 = rand::thread_rng().gen_range(-1.0, 1.0);
    let d = x*x + y*y;
    if d <= 1.0 {
        circle_points += 1;
    }
    circle_points
}
```

And here is the SystemVerilog, calling the DPI method `num_iter` times:

```systemverilog
import "DPI-C" function int monte_carlo_subroutine(int circle_points);

function real monte_carlo_calc_pi(int num_iter;);
    int circle_points = 0;
    int square_points = num_iter;
    real pi;
    for (int i = 0; i < num_iter; i++) begin
        circle_points = monte_carlo_subroutine(circle_points);
    end
    pi = 4.0 * (real'(circle_points) / real'(square_points));
    return pi;
endfunction
```

These benchmarks were all run on an Intel Xeon W-3245 CPU @ 3.20GHz.

With `num_iter` set to 100,000,000, the Rust code build with `--release` finished in 1.824 microseconds, while the SystemVerilog took 4.383 microseconds - a 2.4x slowdown. I am actually pleasantly surprised by this. I thought that it would have been much worse. However, this just goes to show that you shouldn't decide to use the DPI for everything, _especially_ if it is a method that is being called on every simulation tick. For example, don't write a clock duty-cycle checker with the DPI.

# Conclusion

- The DPI is great for RPCs, but it does have a relatively hefty performance cost.
- You can (and should) use more than C code for the DPI.
- Please don't write your DPI code in C. At least use C++, and ideally use something with more benefits besides OOP (such as Rust's type-safety and `cargo` package manager, or Python's simplicity).

# Resources

- [The SystemVerilog IEEE Standard](https://ieeexplore.ieee.org/document/8299595)
- [Rust's docs on the FFI](https://doc.rust-lang.org/nomicon/ffi.html)

*Originally published at [https://seanmcloughl.in](https://seanmcloughl.in/rust/systemverilog/dpi/2020/11/07/How-to-Call-Rust-Code-from-SystemVerilog.html) on November 7, 2020.*
