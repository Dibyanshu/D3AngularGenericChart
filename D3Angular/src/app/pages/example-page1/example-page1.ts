import { Component, OnInit } from '@angular/core';
import { LineChart, LineChartData, LineChartGroupData, LineOptions } from '../../shared/LineChart';
import { LineChartCopy } from '../../shared/LineChart-Copy';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [],
  templateUrl: './example-page1.html',
  styleUrl: './example-page1.scss'
})
export class ExamplePage1Component implements OnInit{
  title = 'D3Angular';
  radarChart = null;
  dtsLeg3LineChart: LineChartCopy;

  constructor() {
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.loadLineChart();
      // browser resize event
      // window.addEventListener('resize', () => {
      //   if (this.dtsLeg3LineChart) {
      //     this.dtsLeg3LineChart.resize();
      //   }
      // });
    }, 1000);

  }

  loadLineChart() {
    const isdLineData: LineChartData[] = [
      { labelBottom: 'CMI', value: 2, isComparison: false, labelTop: 'NRCC#1' },
      { labelBottom: 'CHS', value: 50, isComparison: false, labelTop: 'NRCC#1' },
      { labelBottom: 'ABQ', value: 58, isComparison: false, labelTop: 'NRCC#1' },
      { labelBottom: 'LAS', value: 77, isComparison: false, labelTop: 'NRCC#1' },
      { labelBottom: 'GGG', value: 32, isComparison: false, labelTop: 'NRCC#1' },
      { labelBottom: 'SAN', value: 99, isComparison: false, labelTop: 'NRCC#1' },
      { labelBottom: 'TUL', value: 65, isComparison: false, labelTop: 'NRCC#1' },
      { labelBottom: 'Comp1', value: 100, isComparison: true, labelTop: 'NRCC#2' },
      { labelBottom: 'Comp2', value: 98, isComparison: true, labelTop: 'NRCC#2' }
    ];
    const cycleData: LineChartData[] = [
      { labelBottom: 'CMI', value: 76, isComparison: false, labelTop: 'NRCC#1'},
      { labelBottom: 'CHS', value: 79, isComparison: false, labelTop: 'NRCC#1' },
      { labelBottom: 'ABQ', value: 96, isComparison: false, labelTop: 'NRCC#1' },
      { labelBottom: 'LAS', value: 97, isComparison: false, labelTop: 'NRCC#1' },
      { labelBottom: 'GGG', value: 76, isComparison: false, labelTop: 'NRCC#1' },
      { labelBottom: 'SAN', value: 96, isComparison: false, labelTop: 'NRCC#1' },
      { labelBottom: 'TUL', value: 64, isComparison: false, labelTop: 'NRCC#1' },
      { labelBottom: 'Comp1', value: 100, isComparison: true, labelTop: 'NRCC#2' },
      { labelBottom: 'Comp2', value: 98, isComparison: true, labelTop: 'NRCC#2' }
    ];

    const lineChartGroupData: LineChartGroupData[] = [
      { 
        groupId: 'Cycle',
        groupLabel: '8 Week Avg', 
        groupColor: {
          lineColor: '#B02A4C',
          areaColor: '#F9EEF1CC',
          dotColor: '#B02A4C'
        },
        data: cycleData 
      },
      { 
        groupId: 'ISD',
        groupLabel: 'ISD',
        groupColor: {
          lineColor: '#0F0E38',
          areaColor: '#D0DDF7',
          dotColor: '#0F0E38'
        }, 
        data: isdLineData 
      },
    ];
    const lineChartOption: LineOptions = {
      margin: { top: 40, right: 20, bottom: 30, left: 50 },
      maxHeight: 750,
      isTargetLine: true,
      targetData: {
        value: 98,
        color: '#628AB3'
      },
      legendData: [
        { label: 'ISD (06/24/2024)', color: '#0F0E38' },
        { label: '8 week avg.', color: '#B02A4C' },
        { label: 'Goal', color: '#628AB3'}
      ],
      groupDataHighestId: 'Cycle',
    }
    this.dtsLeg3LineChart = new LineChartCopy('#svgDrillDownLineContainer', lineChartGroupData, lineChartOption);
    this.dtsLeg3LineChart.clickEvent = (d) => {
      console.log('clicked', d.labelBottom);
    };
  }
}
