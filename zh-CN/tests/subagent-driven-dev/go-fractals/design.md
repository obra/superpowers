# Go Fractals CLI - 设计

## 概述

一个生成 ASCII 艺术分形的命令行工具。支持两种分形类型，并可配置输出。

## 使用方法

```bash
# Sierpinski triangle
fractals sierpinski --size 32 --depth 5

# Mandelbrot set
fractals mandelbrot --width 80 --height 24 --iterations 100

# Custom character
fractals sierpinski --size 16 --char '#'

# Help
fractals --help
fractals sierpinski --help
```

## 命令

### `sierpinski`

通过递归细分生成谢尔宾斯基三角形。

标志：

* `--size` (默认值: 32) - 三角形底边的字符宽度
* `--depth` (默认值: 5) - 递归深度
* `--char` (默认值: '\*') - 用于填充点的字符

输出：三角形打印到标准输出，每行打印一个。

### `mandelbrot`

将曼德博集合渲染为 ASCII 艺术。将迭代次数映射到字符。

标志：

* `--width` (默认值: 80) - 输出宽度（字符数）
* `--height` (默认值: 24) - 输出高度（字符数）
* `--iterations` (默认值: 100) - 逃逸计算的最大迭代次数
* `--char` (默认值: gradient) - 单个字符，或省略以使用渐变字符 " .:-=+\*#%@"

输出：矩形打印到标准输出。

## 架构

```
cmd/
  fractals/
    main.go           # Entry point, CLI setup
internal/
  sierpinski/
    sierpinski.go     # Algorithm
    sierpinski_test.go
  mandelbrot/
    mandelbrot.go     # Algorithm
    mandelbrot_test.go
  cli/
    root.go           # Root command, help
    sierpinski.go     # Sierpinski subcommand
    mandelbrot.go     # Mandelbrot subcommand
```

## 依赖项

* Go 1.21+
* `github.com/spf13/cobra` 用于 CLI

## 验收标准

1. `fractals --help` 显示用法
2. `fractals sierpinski` 输出可识别的三角形
3. `fractals mandelbrot` 输出可识别的曼德博集合
4. `--size`, `--width`, `--height`, `--depth`, `--iterations` 标志正常工作
5. `--char` 自定义输出字符
6. 无效输入会产生清晰的错误信息
7. 所有测试通过
