import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { RadarChart } from './shared/RadarChart';
import { RadarChartFakeData } from './data/radarChartFake.data';
import { PieChart, PieChartData } from './shared/PieChart';
import { LineChart, LineChartData, LineChartGroupData, LineOptions } from './shared/LineChart';
import { lineChartUpdateData1, lineChartUpdateData2 } from './data/lineChartFake.data';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgbModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit{
  title = 'D3Angular';
  radarChart = null;

  constructor(private modalService: NgbModal) {
  }

  ngOnInit(): void {
    setTimeout(() => {
      const chartData = new RadarChartFakeData().generateData();
      this.loadRadarChart(chartData);

      this.loadPieChart();
      this.loadDonutChart();

      this.loadLineChart();
    }, 1000);
  }

  loadLineChart() {
    type APIResponseData = {
      data: {
        value: number;
        staionOrStore: string;
        region: string;
        isFocusLocation: boolean;
      }[];
      groupName: string;      
    }
    const isdLineData: LineChartData[] = [
      { labelBottom: 'CMI', value: 2, isComparison: false, labelTop: 'NRCC#1' },
      { labelBottom: 'CHS', value: 50, isComparison: false, labelTop: 'NRCC#1' },
      { labelBottom: 'ABQ', value: 58, isComparison: false, labelTop: 'NRCC#1' },
      { labelBottom: 'LAS', value: 77, isComparison: false, labelTop: 'NRCC#1' },
      { labelBottom: 'GGG', value: 32, isComparison: false, labelTop: 'NRCC#1' },
      { labelBottom: 'SAN', value: 99, isComparison: false, labelTop: 'NRCC#1' },
      { labelBottom: 'TUL', value: 65, isComparison: false, labelTop: 'NRCC#1' }
    ];
    const cycleData: LineChartData[] = [
      { labelBottom: 'CMI', value: 76, isComparison: false, labelTop: 'NRCC#1'},
      { labelBottom: 'CHS', value: 79, isComparison: false, labelTop: 'NRCC#1' },
      { labelBottom: 'ABQ', value: 96, isComparison: false, labelTop: 'NRCC#1' },
      { labelBottom: 'LAS', value: 97, isComparison: false, labelTop: 'NRCC#1' },
      { labelBottom: 'GGG', value: 76, isComparison: false, labelTop: 'NRCC#1' },
      { labelBottom: 'SAN', value: 96, isComparison: false, labelTop: 'NRCC#1' },
      { labelBottom: 'TUL', value: 64, isComparison: false, labelTop: 'NRCC#1' }
    ];

    const lineChartGroupData: LineChartGroupData[] = [
      { 
        groupId: 'ISD',
        groupLabel: 'ISD',
        groupColor: {
          lineColor: '#0F0E38',
          areaColor: '#E6F0FFCC',
          dotColor: '#0F0E38'
        }, 
        data: isdLineData 
      },
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
    ];
    const lineChartGroupDataUpdated: LineChartGroupData[] = [
      { 
        groupId: 'ISD',
        groupLabel: 'ISD', 
        groupColor: {
          lineColor: '#0F0E38',
          areaColor: '#E6F0FFCC',
          dotColor: '#0F0E38'
        },
        data: lineChartUpdateData1 
      },
      { 
        groupId: 'Cycle',
        groupLabel: '8 Week Avg', 
        groupColor: {
          lineColor: '#B02A4C',
          areaColor: '#F9EEF1CC',
          dotColor: '#B02A4C'
        },  
        data: lineChartUpdateData2 
      },
    ];
    const lineChartOption: LineOptions = {
      margin: { top: 50, right: 20, bottom: 30, left: 50 },
      legendData: [
        { label: 'ISD (06/24/2024)', color: '#0F0E38' },
        { label: '8 week avg.', color: '#B02A4C' },
        { label: 'Goal', color: '#628AB3'}
      ]
    }
    let dtsLeg3LineChart = new LineChart('#svgLineContainer', lineChartGroupData, lineChartOption);
    // console.log('::dtsLeg3LineChart.groupData::',dtsLeg3LineChart.groupData);
    /*
    dtsLeg3LineChart.groupData = lineChartGroupDataUpdated;
    setTimeout(() => {
      dtsLeg3LineChart.render(true);
    }, 3000);
    */
  }

  loadRadarChart(chartData: Array<{ axisSet: Array<{ axis: string, value: number }> }>) {
    const formatedChartData = chartData;
    this.radarChart = new RadarChart('#svgRadarContainer')
    this.radarChart.data(formatedChartData);
    this.radarChart.render();
  }

  loadPieChart() {
    const pieChartData: PieChartData[] = [
      { label: 'Completed', value: Math.floor(Math.random() * 1000) },
      { label: 'To be recieved', value: Math.floor(Math.random() * 1000) },
      { label: 'In progress', value: Math.floor(Math.random() * 1000) }
    ];
    new PieChart('#svgPieContainer', pieChartData, {chartType: 'pie', arcScalingEnable: true, arcScalingIndex: 0});
  }

  loadDonutChart() {
    const pieChartData: PieChartData[] = [
      { label: 'Completed', value: Math.floor(Math.random() * 1000) },
      { label: 'To be recieved', value: Math.floor(Math.random() * 1000) },
      { label: 'In progress', value: Math.floor(Math.random() * 1000) }
    ];
    new PieChart('#svgDonutContainer', pieChartData, {chartType: 'donut', innerRadius: 170});
  }

  public open(modal: any): void {
    this.modalService.open(modal);
  }
}
