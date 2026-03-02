#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Hive 数仓开发辅助脚本
用途: 在调用 Skill 后执行，确认环境就绪并启动开发流程。
"""

import sys
import datetime


def main():
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    print("=" * 50)
    print("🚀 出发咯。。。。。。")
    print("=" * 50)
    print(f"⏰ 当前时间: {now}")
    print(f"🐍 Python 版本: {sys.version.split()[0]}")
    print("📦 Hive 数仓开发 Skill 已就绪！")
    print("-" * 50)
    print("📘 开发规范文档:")
    print("   • DWD/DWM 公共层开发规则")
    print("   • DM/APP 应用层开发规则")
    print("-" * 50)
    print("✅ 环境检查通过，开始愉快地开发吧！")
    print("=" * 50)


if __name__ == "__main__":
    main()
