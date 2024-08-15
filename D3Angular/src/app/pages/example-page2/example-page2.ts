import { Component, OnInit } from '@angular/core';
import { LineChart, LineChartData, LineChartGroupData, LineOptions } from '../../shared/LineChart';
import { LineChartCopy } from '../../shared/LineChart-Copy';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [],
  templateUrl: './example-page2.html',
  styleUrl: './example-page2.scss'
})
export class ExamplePage2Component implements OnInit{
  title = 'D3Angular';
  radarChart = null;
  dtsDDLineChart: LineChartCopy;

  constructor() {
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.loadLineChart();
      // browser resize event
      window.addEventListener('resize', () => {
        if (this.dtsDDLineChart) {
          this.dtsDDLineChart.resize();
        }
      });
    }, 1000);

  }

  loadLineChart() {
    const isdLineData: LineChartData[] = [
      { labelBottom: '01/01/2024 - 02/28/2024', value: 2, isComparison: false, labelTop: 'NRCC#1' },
      { labelBottom: '01/01/2024 - 02/28/2024', value: 50, isComparison: false, labelTop: 'NRCC#1' },
      { labelBottom: '01/01/2024 - 02/28/2024', value: 58, isComparison: false, labelTop: 'NRCC#1' },
      { labelBottom: '01/01/2024 - 02/28/2024', value: 77, isComparison: false, labelTop: 'NRCC#1' },
      { labelBottom: '01/01/2024 - 02/28/2024', value: 32, isComparison: false, labelTop: 'NRCC#1' },
      { labelBottom: '01/01/2024 - 02/28/2024', value: 99, isComparison: false, labelTop: 'NRCC#1' }
    ];
    const cycleData: LineChartData[] = [
      { labelBottom: '01/01/2024 - 02/28/2024', value: 76, isComparison: false, labelTop: 'NRCC#1'},
      { labelBottom: '01/01/2024 - 02/28/2024', value: 79, isComparison: false, labelTop: 'NRCC#1' },
      { labelBottom: '01/01/2024 - 02/28/2024', value: 96, isComparison: false, labelTop: 'NRCC#1' },
      { labelBottom: '01/01/2024 - 02/28/2024', value: 97, isComparison: false, labelTop: 'NRCC#1' },
      { labelBottom: '01/01/2024 - 02/28/2024', value: 76, isComparison: false, labelTop: 'NRCC#1' },
      { labelBottom: '01/01/2024 - 02/28/2024', value: 96, isComparison: false, labelTop: 'NRCC#1' }
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
      xAxisLabel: {
        isLebelBreak: true,
      }
    }
    this.dtsDDLineChart = new LineChartCopy('#svgDrillDownLineContainer', lineChartGroupData, lineChartOption);
    this.dtsDDLineChart.clickEvent = (d) => {
      console.log('clicked', d.labelBottom);
    };
  }
}
