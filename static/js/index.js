
//
//
//
//
//
//
//
//
//
// 全局变量：当前猪场ID
let currentFarmId = 'farm1'; // 初始猪场
let behaviorData = {}; // 存储当前猪场的行为数据

// 柱状图模块1
(function() {
  // 1实例化对象
  var myChart = echarts.init(document.querySelector(".bar .chart"));
  // 2. 指定配置项和数据
  var option = {
    color: ["#2f89cf"],
    tooltip: {
      trigger: "axis",
      axisPointer: {
        // 坐标轴指示器，坐标轴触发有效
        type: "shadow" // 默认为直线，可选为：'line' | 'shadow'
      }
    },
    // 修改图表的大小
    grid: {
      left: "0%",
      top: "10px",
      right: "0%",
      bottom: "4%",
      containLabel: true
    },
    xAxis: [
      {
        type: "category",
        data: [
          "stand",
          "ruminate",
          "lie",
          "eat",
          "drink"
        ],
        axisTick: {
          alignWithLabel: true
        },
        // 修改刻度标签 相关样式
        axisLabel: {
          color: "rgba(255,255,255,.6) ",
          fontSize: "12"
        },
        // 不显示x坐标轴的样式
        axisLine: {
          show: false
        }
      }
    ],
    yAxis: [
      {
        type: "value",
        // 修改刻度标签 相关样式
        axisLabel: {
          color: "rgba(255,255,255,.6) ",
          fontSize: 12
        },
        // y轴的线条改为了 2像素
        axisLine: {
          lineStyle: {
            color: "rgba(255,255,255,.1)",
            width: 2
          }
        },
        // y轴分割线的颜色
        splitLine: {
          lineStyle: {
            color: "rgba(255,255,255,.1)"
          }
        }
      }
    ],
    series: [
      {
        name: "直接访问",
        type: "bar",
        barWidth: "35%",
        data: [0, 0, 0, 0, 0], // 修改：移除多余的第6个0
        itemStyle: {
          // 修改柱子圆角
          barBorderRadius: 5
        }
      }
    ]
  };
  // 3. 把配置项给实例对象
  myChart.setOption(option);
  window.barChart = myChart;

  // 4. 让图表跟随屏幕自动的去适应
  window.addEventListener("resize", function() {
    myChart.resize();
  });

// 修复：动态加载行为数据 - 适配 farm1_behavior_data.json 的正确格式
window.loadBehaviorDataForFarm = function(farmId) {
    // 构造 JSON 文件的相对路径，Flask 会从 static 文件夹提供
    const jsonFileName = `static/data/${farmId}_behavior_data.json`;
    console.log(`Loading data from: ${jsonFileName}`);

    // 重置当前数据
    behaviorData = {};

    fetch(jsonFileName)
        .then(response => {
            if (!response.ok) {
                console.error(`HTTP error! status: ${response.status}`);
                // 如果请求失败，使用默认数据
                return {
                    video_info: {
                        name: "default.mp4",
                        fps: 25.0,
                        total_frames: 0,
                        extracted_time: "2025-01-01 00:00:00"
                    },
                    timeline: [
                        { frame_idx: 0, timestamp: 0, counts: { stand: 0, ruminate: 0, lie: 0, eat: 0, drink: 0 } }
                    ]
                };
            }
            return response.json();
        })
        .then(data => {
            console.log(`Data loaded for ${farmId}:`, data);
            behaviorData = data; // 存储完整数据

            // 计算总计数据并更新柱状图
            const totals = { stand: 0, ruminate: 0, lie: 0, eat: 0, drink: 0 };
            data.timeline.forEach(frame => { // 从timeline数组中提取数据
                totals.stand += frame.counts?.stand || 0;
                totals.ruminate += frame.counts?.ruminate || 0;
                totals.lie += frame.counts?.lie || 0;
                totals.eat += frame.counts?.eat || 0;
                totals.drink += frame.counts?.drink || 0;
            });

            console.log(`Calculated totals:`, totals); // 调试信息

            const barData = [totals.stand, totals.ruminate, totals.lie, totals.eat, totals.drink];
            console.log(`Bar chart data:`, barData); // 调试信息

            myChart.setOption({
                series: [{
                    data: barData
                }]
            });

            // 更新监测统计数据
            updateMonitorStats(data); // 直接使用原始数据格式
        })
        .catch(error => {
            console.error(`Failed to load data for ${farmId}:`, error);
            myChart.setOption({ series: [{ data: [0, 0, 0, 0, 0] }] });
            // 即使加载失败也要更新监测统计
            updateMonitorStats({
                video_info: {
                    name: "default.mp4",
                    fps: 25.0,
                    total_frames: 0,
                    extracted_time: "2025-01-01 00:00:00"
                },
                timeline: [
                    { frame_idx: 0, timestamp: 0, counts: { stand: 0, ruminate: 0, lie: 0, eat: 0, drink: 0 } }
                ]
            });
        });
};

})();

// 数字滚动动画函数
function animateValue(element, target, duration = 1000) {
  const start = parseInt(element.textContent) || 0;
  const increment = target > start ? 1 : -1;
  const stepTime = 50;
  const totalSteps = duration / stepTime;
  const stepSize = (target - start) / totalSteps;
  let current = start;

  const timer = setInterval(() => {
    current += stepSize;
    if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
      clearInterval(timer);
      current = target;
    }
    // 处理百分比显示
    element.textContent = element.textContent.includes('%')
      ? current.toFixed(1) + '%'
      : Math.round(current).toString();
  }, stepTime);
}

// 生成随机异常个体数（不超过监测总数的8%）
function generateRandomAbnormalCount(totalCount) {
    // 计算最大允许异常数（监测总数的8%）
    const maxAbnormal = Math.floor(totalCount * 0.08);
    // 生成0到maxAbnormal之间的随机整数
    return Math.floor(Math.random() * (maxAbnormal + 1));
}

// 根据异常个体数计算异常率
function calculateAbnormalRate(abnormalCount, totalCount) {
    if (totalCount === 0) return "0.0%";
    const rate = (abnormalCount / totalCount) * 100;
    return rate.toFixed(1) + "%";
}

function updateMonitorStats(data) {
    // 计算最大监测总数（单帧内所有行为的计数总和）
    const maxTotal = Math.max(...data.timeline.map(frame =>
        Object.values(frame.counts).reduce((sum, val) => sum + val, 0)
    ));

    // 生成随机异常个体数（不超过监测总数的8%）
    const abnormalCount = generateRandomAbnormalCount(maxTotal);

    // 根据异常个体数计算异常率
    const abnormalRate = calculateAbnormalRate(abnormalCount, maxTotal);

    // 更新DOM元素
    const totalStatElement = document.querySelector('.stat-item:nth-child(1) .stat-value');
    const abnormalStatElement = document.querySelector('.stat-item:nth-child(2) .stat-value');
    const rateStatElement = document.querySelector('.stat-item:nth-child(3) .stat-value');
    const leftTotalElement = document.querySelector('.no-hd ul li:first-child');
    const leftAbnormalElement = document.querySelector('.no-hd ul li:last-child');

    if (totalStatElement) animateValue(totalStatElement, maxTotal);
    if (abnormalStatElement) animateValue(abnormalStatElement, abnormalCount);
    if (rateStatElement) rateStatElement.textContent = abnormalRate;
    if (leftTotalElement) animateValue(leftTotalElement, maxTotal);
    if (leftAbnormalElement) animateValue(leftAbnormalElement, abnormalCount);
}

// 添加猪场切换函数
function switchFarm(newFarmId) {
  console.log(`Switching to farm: ${newFarmId}`);
  currentFarmId = newFarmId;

  // 更新视频源 - 现在使用相对路径，Flask 会自动从 static/images/ 提供
  const videoPlayer = document.querySelector('.monitor-view video');
  if (videoPlayer) {
    // 修正：视频路径也应使用相对路径，与 JSON 路径类似
    // 注意：这里假设所有视频都在 static/images/ 下
    const videoSrc = `static/images/${newFarmId}_video.mp4`; // 使用相对路径
    console.log(`Setting video source to: ${videoSrc}`);

    // 先暂停当前视频
    videoPlayer.pause();

    // 设置新的视频源
    videoPlayer.src = videoSrc;

    // 重新加载并播放视频
    videoPlayer.load();
    videoPlayer.onloadeddata = function() {
      videoPlayer.play();
      videoPlayer.onloadeddata = null; // 清除事件监听器
    };
  } else {
    console.warn('Video player element not found');
  }

  // 更新行为数据 - 修正：确保这里调用的是修改后的 loadBehaviorDataForFarm
  window.loadBehaviorDataForFarm(newFarmId);

  // 更新按钮激活状态
  document.querySelectorAll('.farm-switcher .farm-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.getElementById(`${newFarmId}Btn`).classList.add('active');
}

// 视频时间更新事件监听 - 仅当视频存在时添加
document.addEventListener('DOMContentLoaded', function() {
  // 绑定猪场切换按钮事件
  document.getElementById('farm1Btn').addEventListener('click', () => switchFarm('farm1'));
  document.getElementById('farm2Btn').addEventListener('click', () => switchFarm('farm2'));
  document.getElementById('farm3Btn').addEventListener('click', () => switchFarm('farm3'));
  document.getElementById('farm4Btn').addEventListener('click', () => switchFarm('farm4'));

  // 初始化加载一号猪场数据
  window.loadBehaviorDataForFarm(currentFarmId);

  // 为视频添加时间更新事件监听器 - 修复字段映射
  const videoPlayer = document.querySelector('.monitor-view video');
  if (videoPlayer) {
    // 定时更新异常个体数和异常率，每1-3秒更新一次
    let lastUpdateTime = 0;
    let currentAbnormal = 0;
    let currentAbnormalRate = "0.0%";

    // 每秒更新一次异常个体数和异常率
    setInterval(() => {
      // 获取当前监测总数
      const totalStatElement = document.querySelector('.stat-item:nth-child(1) .stat-value');
      const currentTotal = parseInt(totalStatElement?.textContent || 0);

      // 生成随机异常个体数（不超过监测总数的8%）
      currentAbnormal = generateRandomAbnormalCount(currentTotal);

      // 根据异常个体数计算异常率
      currentAbnormalRate = calculateAbnormalRate(currentAbnormal, currentTotal);

      // 更新显示
      const abnormalStatElement = document.querySelector('.stat-item:nth-child(2) .stat-value');
      const rateStatElement = document.querySelector('.stat-item:nth-child(3) .stat-value');
      const leftAbnormalElement = document.querySelector('.no-hd ul li:last-child');

      if (abnormalStatElement) abnormalStatElement.textContent = currentAbnormal;
      if (rateStatElement) rateStatElement.textContent = currentAbnormalRate;
      if (leftAbnormalElement) leftAbnormalElement.textContent = currentAbnormal;
    }, 1000); // 每秒更新一次

    videoPlayer.addEventListener('timeupdate', () => {
      if (!behaviorData.timeline || behaviorData.timeline.length === 0) return; // 如果没有数据则跳过

      const currentTime = videoPlayer.currentTime;
      // 在timeline中查找与当前时间最接近的帧数据（允许0.5秒误差）
      const frameData = behaviorData.timeline.find(item =>
        item.timestamp <= currentTime && Math.abs(item.timestamp - currentTime) < 0.5
      );
      if (!frameData) return; // 无匹配数据则跳过

      // 更新柱状图数据
      const barData = [
        frameData.counts?.stand || 0,
        frameData.counts?.ruminate || 0,
        frameData.counts?.lie || 0,
        frameData.counts?.eat || 0,
        frameData.counts?.drink || 0
      ];

      if (window.barChart) {
        window.barChart.setOption({ series: [{ data: barData }] });
      }

      // 计算当前帧的监测总数
      const currentTotal = Object.values(frameData.counts || {}).reduce((sum, val) => sum + val, 0);

      // 更新监测统计显示
      const totalStatElement = document.querySelector('.stat-item:nth-child(1) .stat-value');
      const leftTotalElement = document.querySelector('.no-hd ul li:first-child');

      if (totalStatElement) totalStatElement.textContent = currentTotal;
      if (leftTotalElement) leftTotalElement.textContent = currentTotal;
    });
  }
});

// 折线图1模块制作
(function() {
  var yearData = [
    {
      // year: "2023", // 年份
      data: [
        // 两个数组是因为有两条线
        [225, 210, 200, 180, 154, 128, 119, 96, 120, 132, 150, 167],
        [215, 201, 191, 169, 148, 132, 112, 91, 129, 133, 154, 171]
      ]
    },
    {
      // year: "2024", // 年份
      data: [
        // 两个数组是因为有两条线
        [123, 175, 112, 197, 121, 67, 98, 21, 43, 64, 76, 38],
        [143, 131, 165, 123, 178, 21, 82, 64, 43, 60, 19, 34]
      ]
    }
  ];
  // 1. 实例化对象
  var myChart = echarts.init(document.querySelector(".line .chart"));
  // 2.指定配置
  var option = {
    // 通过这个color修改两条线的颜色
    color: ["#00f2f1", "#ed3f35"],
    tooltip: {
      trigger: "axis"
    },
    legend: {
      // 如果series 对象有name 值，则 legend可以不用写data
      // 修改图例组件 文字颜色
      textStyle: {
        color: "#4c9bfd"
      },
      // 这个10% 必须加引号
      right: "10%"
    },
    grid: {
      top: "20%",
      left: "3%",
      right: "4%",
      bottom: "3%",
      show: true, // 显示边框
      borderColor: "#012f4a", // 边框颜色
      containLabel: true // 包含刻度文字在内
    },

    xAxis: {
      type: "category",
      boundaryGap: false,
      data: [
        "5℃",
        "7.5℃",
        "10℃",
        "12.5℃",
        "15℃",
        "17.5℃",
        "20℃",
        "22.5℃",
        "25℃",
        "27.5℃",
        "30℃",
        "32.5℃"
      ],
      axisTick: {
        show: false // 去除刻度线
      },
      axisLabel: {
        color: "#4c9bfd" // 文本颜色
      },
      axisLine: {
        show: false // 去除轴线
      }
    },
    yAxis: {
      type: "value",
      axisTick: {
        show: false // 去除刻度线
      },
      axisLabel: {
        color: "#4c9bfd" // 文本颜色
      },
      axisLine: {
        show: false // 去除轴线
      },
      splitLine: {
        lineStyle: {
          color: "#012f4a" // 分割线颜色
        }
      }
    },
    series: [
      {
        name: "2023",
        type: "line",
        // true 可以让我们的折线显示带有弧度
        smooth: true,
        data: yearData[0].data[0]
      },
      {
        name: "2024",
        type: "line",
        smooth: true,
        data: yearData[0].data[1]
      }
    ]
  };

  // 3. 把配置给实例对象
  myChart.setOption(option);
  // 4. 让图表跟随屏幕自动的去适应
  window.addEventListener("resize", function() {
    myChart.resize();
  });

  // 5.点击切换效果
  $(".line h2").on("click", "a", function() {
    // alert(1);
    // console.log($(this).index());
    // 点击 a 之后 根据当前a的索引号 找到对应的 yearData的相关对象
    // console.log(yearData[$(this).index()]);
    var obj = yearData[$(this).index()];
    option.series[0].data = obj.data[0];
    option.series[1].data = obj.data[1];
    // 需要重新渲染
    myChart.setOption(option);
  });
})();

// 折线图2 模块制作
(function() {
  var myChart = echarts.init(document.querySelector(".line2 .chart"));
  var option = {
    tooltip: {
      trigger: "axis"
    },
    legend: {
      top: "0%",
      data: ["邮件营销", "联盟广告", "视频广告", "直接访问", "搜索引擎"],
      textStyle: {
        color: "rgba(255,255,255,.5)",
        fontSize: "12"
      }
    },

    grid: {
      left: "10",
      top: "30",
      right: "10",
      bottom: "10",
      containLabel: true
    },
    xAxis: [
      {
        type: "category",
        boundaryGap: false,
        // x轴更换数据
        data: [
          "5%",
          "7.5%",
          "10%",
          "12.5%",
          "15%",
          "17.5%",
          "20%",
          "22.5%",
          "25%",
          "27.5%",
          "30%",
          "32.5%",
          "35%",
          "37.5%",
          "40%",
          "42.5%",
          "45%",
          "47.5%",
          "50%",
          "52.5%",
          "55%",
          "57.5%",
          "60%",
          "62.5%",
          "65%",
          "67.5%",
          "70%",
          "72.5%",
          "75%",
          "77.5%"
        ],
        // 文本颜色为rgba(255,255,255,.6)  文字大小为 12
        axisLabel: {
          textStyle: {
            color: "rgba(255,255,255,.6)",
            fontSize: 12
          }
        },
        // x轴线的颜色为   rgba(255,255,255,.2)
        axisLine: {
          lineStyle: {
            color: "rgba(255,255,255,.2)"
          }
        }
      }
    ],
    yAxis: [
      {
        type: "value",
        axisTick: { show: false },
        axisLine: {
          lineStyle: {
            color: "rgba(255,255,255,.1)"
          }
        },
        axisLabel: {
          textStyle: {
            color: "rgba(255,255,255,.6)",
            fontSize: 12
          }
        },
        // 修改分割线的颜色
        splitLine: {
          lineStyle: {
            color: "rgba(255,255,255,.1)"
          }
        }
      }
    ],
    series: [
      {
        name: "2023",
        type: "line",
        smooth: true,
        // 单独修改当前线条的样式
        lineStyle: {
          color: "#0184d5",
          width: "2"
        },
        // 填充颜色设置
        areaStyle: {
          color: new echarts.graphic.LinearGradient(
            0,
            0,
            0,
            1,
            [
              {
                offset: 0,
                color: "rgba(1, 132, 213, 0.4)" // 渐变色的起始颜色
              },
              {
                offset: 0.8,
                color: "rgba(1, 132, 213, 0.1)" // 渐变线的结束颜色
              }
            ],
            false
          ),
          shadowColor: "rgba(0, 0, 0, 0.1)"
        },
        // 设置拐点
        symbol: "circle",
        // 拐点大小
        symbolSize: 8,
        // 开始不显示拐点， 鼠标经过显示
        showSymbol: false,
        // 设置拐点颜色以及边框
        itemStyle: {
          color: "#0184d5",
          borderColor: "rgba(221, 220, 107, .1)",
          borderWidth: 12
        },
        data: [
          245,
          239,
          220,
          200,
          205,
          200,
          195,
          199,
          187,
          160,
          144,
          125,
          100,
          95,
          87,
          80,
          76,
          60,
          65,
          58,
          49,
          36,
          24,
          20,
          46,
          59,
          68,
          99,
          123,
          143
        ]
      },
      {
        name: "2024",
        type: "line",
        smooth: true,
        lineStyle: {
          normal: {
            color: "#00d887",
            width: 2
          }
        },
        areaStyle: {
          normal: {
            color: new echarts.graphic.LinearGradient(
              0,
              0,
              0,
              1,
              [
                {
                  offset: 0,
                  color: "rgba(0, 216, 135, 0.4)"
                },
                {
                  offset: 0.8,
                  color: "rgba(0, 216, 135, 0.1)"
                }
              ],
              false
            ),
            shadowColor: "rgba(0, 0, 0, 0.1)"
          }
        },
        // 设置拐点 小圆点
        symbol: "circle",
        // 拐点大小
        symbolSize: 5,
        // 设置拐点颜色以及边框
        itemStyle: {
          color: "#00d887",
          borderColor: "rgba(221, 220, 107, .1)",
          borderWidth: 12
        },
        // 开始不显示拐点， 鼠标经过显示
        showSymbol: false,
        data: [
          250,
          242,
          235,
          215,
          210,
          205,
          200,
          198,
          192,
          185,
          170,
          155,
          130,
          120,
          110,
          105,
          102,
          90,
          95,
          88,
          82,
          70,
          60,
          55,
          65,
          75,
          85,
          105,
          130,
          150
        ]
      }
    ]
  };
  myChart.setOption(option);
  // 4. 让图表跟随屏幕自动的去适应
  window.addEventListener("resize", function() {
    myChart.resize();
  });
})();


(function() {
  var myChart = echarts.init(document.querySelector(".pie2 .chart"));
  var option = {
    color: [
      "#006cff",
      "#60cda0",
      "#ed8884",
      "#ff9f7f",
      "#0096ff",
      "#9fe6b8",
      "#32c5e9",
      "#1d9dff"
    ],
    tooltip: {
      trigger: "item",
      formatter: "{a} <br/>{b} : {c} ({d}%)"
    },
    legend: {
      bottom: "0%",
      itemWidth: 10,
      itemHeight: 10,
      textStyle: {
        color: "rgba(255,255,255,.5)",
        fontSize: "12"
      }
    },
    series: [
      {
        name: "牛场分布",
        type: "pie",
        radius: ["10%", "70%"],
        center: ["50%", "50%"],
        roseType: "radius",
        // 图形的文字标签
        label: {
          fontSize: 10
        },
        // 链接图形和文字的线条
        labelLine: {
          // length 链接图形的线条
          length: 6,
          // length2 链接文字的线条
          length2: 8
        },
        data: [
          {value: 20, name: "一号牛场"},
          {value: 26, name: "二号牛场"},
          {value: 24, name: "三号牛场"},
          {value: 25, name: "四号牛场"},
          {value: 20, name: "五号牛场"},
          {value: 25, name: "六号牛场"},
          {value: 30, name: "七号牛场"},
          {value: 42, name: "八号牛场"}
        ]
      }
    ]
  };
  myChart.setOption(option);
  // 监听浏览器缩放，图表对象调用缩放resize函数
  window.addEventListener("resize", function() {
    myChart.resize();
  });
})();

// 初始化光照强度与异常个体数关系的折线图
(function() {
  // 确保DOM完全加载后再初始化图表
  document.addEventListener('DOMContentLoaded', function() {
    // 确保DOM元素已加载
    const chartElement = document.getElementById('lightIntensityChart');
    if(chartElement) {
      // 基于你提供的数据创建折线图
      const lightIntensityData = [
        245, 239, 220, 200, 205, 200, 195, 199, 187, 160,
        144, 125, 100, 95, 87, 80, 76, 60, 65, 58, 49,
        36, 24, 20, 46, 59, 68, 99, 123, 143
      ];

      // 模拟异常个体数数据（与光照强度相关）
      const abnormalCountData = [
        5, 4, 6, 8, 7, 8, 9, 7, 10, 12,
        14, 16, 18, 19, 20, 22, 21, 25, 24, 23,
        26, 28, 30, 32, 28, 25, 23, 20, 18, 16
      ];

      // 初始化图表
      const lightIntensityChart = echarts.init(chartElement);

      // 配置图表选项
      const option = {
        color: ['#00f2f1', '#ed3f35'],
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          textStyle: {
            color: '#4c9bfd'
          },
          right: '10%'
        },
        grid: {
          top: '20%',
          left: '3%',
          right: '4%',
          bottom: '3%',
          show: true,
          borderColor: '#012f4a',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: Array.from({length: 30}, (_, i) => `${i+1}h`),
          axisTick: {
            show: false
          },
          axisLabel: {
            color: '#4c9bfd'
          },
          axisLine: {
            show: false
          }
        },
        yAxis: [
          {
            type: 'value',
            name: '光照强度 (Lx)',
            axisTick: {
              show: false
            },
            axisLabel: {
              color: '#4c9bfd'
            },
            axisLine: {
              show: false
            },
            splitLine: {
              lineStyle: {
                color: '#012f4a'
              }
            }
          },
          {
            type: 'value',
            name: '异常个体数',
            axisTick: {
              show: false
            },
            axisLabel: {
              color: '#4c9bfd'
            },
            axisLine: {
              show: false
            },
            splitLine: {
              show: false
            }
          }
        ],
        series: [
          {
            name: '光照强度',
            type: 'line',
            smooth: true,
            data: lightIntensityData,
            yAxisIndex: 0
          },
          {
            name: '异常个体数',
            type: 'line',
            smooth: true,
            data: abnormalCountData,
            yAxisIndex: 1
          }
        ]
      };

      // 应用配置
      lightIntensityChart.setOption(option);

      // 监听窗口大小变化
      window.addEventListener("resize", function() {
        lightIntensityChart.resize();
      });
    }
  });
})();



// 页面加载完成后自动连接摄像头
window.onload = function() {
    // 自动摄像头连接
    simulateCameraConnection();

    // 初始化视频播放
    const video = document.getElementById('live-video');
    video.src = 'static/images/farm1_video.mp4';
    video.play();

    // 更新视频源信息
    document.getElementById('video-source').textContent = '视频源：摄像头 (farm1)';
};

// 摄像头连接功能
function simulateCameraConnection() {
    const cameraStatus = document.getElementById('camera-status');
    cameraStatus.textContent = '摄像头已连接';
    cameraStatus.className = 'camera-status connected';

    showNotification('摄像头已成功连接', 'success');


    const video = document.getElementById('live-video');
    video.src = 'static/images/farm1_video.mp4';

    // 更新状态提示
    document.getElementById('video-source').textContent = '视频源：摄像头 (farm1)';


    document.getElementById('real-camera-note').style.display = 'none';
}



// 添加摄像头连接按钮点击事件
document.getElementById('connect-camera-btn').addEventListener('click', function() {
    const cameraStatus = document.getElementById('camera-status');

    if (cameraStatus.className.includes('disconnected')) {
        simulateCameraConnection();
    } else {
        disconnectCamera();
    }
});

// 添加通知功能
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 3000);
}