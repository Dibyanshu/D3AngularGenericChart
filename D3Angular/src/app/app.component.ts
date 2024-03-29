import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { RadarChart } from './shared/RadarChart';
import { RadarChartFakeData } from './data/radarChartFake.data';
import { PieChart, PieChartData } from './shared/PieChart';

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
    }, 1000);
  }

  loadRadarChart(chartData: Array<{ axisSet: Array<{ axis: string, value: number }> }>) {
    const formatedChartData = chartData;
    this.radarChart = new RadarChart('#svgRadarContainer')
    this.radarChart.data(formatedChartData);
    this.radarChart.render();
  }

  loadPieChart() {
    const pieChartData: PieChartData[] = [
      { label: 'Pick in progress', value: Math.floor(Math.random() * 1000) },
      { label: 'Completely picked', value: Math.floor(Math.random() * 1000) }
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
