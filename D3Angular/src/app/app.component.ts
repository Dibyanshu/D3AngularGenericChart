import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { RadarChartD3 } from './shared/RadarChart';
import { RadarChartFakeData } from './data/radarChartFake.data';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgbModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit{
  title = 'D3Angular';
  radarChart = new RadarChartD3('#svgContainer')

  constructor(private modalService: NgbModal) {
  }

  ngOnInit(): void {
    setTimeout(() => {
      const chartData = new RadarChartFakeData().generateData();
      this.loadRadarChart(chartData);
    }, 1000);
  }

  loadRadarChart(chartData: number[][]) {
    const formatedChartData = chartData;
    // this.radarChart.multiAxesLineColor = this.generatedColorSet
    // this.radarChart.emptyMessageText = this.emptyMsgText
    this.radarChart.data(formatedChartData);

    this.radarChart.render();
  }

  public open(modal: any): void {
    this.modalService.open(modal);
  }
}
