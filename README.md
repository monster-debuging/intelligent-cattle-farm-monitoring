# 牛场智能监测与行为分析系统（基于 YOLOv11n）

<div align="center">

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.0+-ee4c2c.svg)](https://pytorch.org/)
[![YOLOv11](https://img.shields.io/badge/YOLO-v11-00a8e8.svg)](https://github.com/ultralytics/ultralytics)
[![mAP](https://img.shields.io/badge/mAP50-97.8%25-brightgreen.svg)]()

</div>

---

## 📖 项目简介

本项目针对规模化牛场智能化监测需求，基于 **YOLOv11n** 构建轻量化牛只行为检测系统，实现 **进食、躺卧、反刍、站立、行走** 等行为的实时识别与健康预警。

系统采用 **"大屏监控 + 数据可视化"** 架构，支持多牛舍实时监控、异常行为预警、环境数据展示等功能。最终模型 **mAP50 达 97.8%**，参数量仅 **3.4M**，满足边缘设备实时部署需求。

---

## 🎯 主要特性

| 特性 | 描述 |
|:----:|:----:|
| **轻量化模型** | YOLOv11n，参数 3.4M，GFLOPs 7.9 |
| **高精度检测** | mAP50 97.8%，较基线提升 8.0% |
| **多牛舍支持** | 支持 4 个牛舍场景一键切换 |
| **实时监测** | 30+ FPS 实时视频流检测 |
| **异常预警** | 可提前 1-2 天预警健康风险 |
| **数据可视化** | 监测总数、异常率、环境参数动态展示 |

---

## 📊 模型性能

### 核心指标

| 指标 | 数值 |
|:----:|:----:|
| mAP50 | 97.8% |
| 参数量 | 3.4M |
| GFLOPs | 7.9 |
| 推理速度 | 30+ FPS |
| 行为类别 | 5 类（进食、躺卧、反刍、站立、行走） |

### 改进模块

| 模块 | 作用 | 贡献 |
|:----:|:----:|:----:|
| **SCSA** | 空间跨尺度注意力 | 提升特征提取效率 |
| **WFU** | 加权特征融合单元 | 解决重叠遮挡问题 |
| **WT** | 窗口变换卷积 | 增强相似行为区分力 |

---

## 🛠️ 环境依赖

```txt
torch>=2.0.0
torchvision>=0.15.0
opencv-python>=4.8.0
numpy>=1.24.0
onnx>=1.14.0
onnxruntime>=1.15.0
labelme>=5.0.0
tensorboard>=2.13.0
