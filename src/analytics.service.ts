import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AnalyticsService {
  private readonly measurementId = 'YOUR_MEASUREMENT_ID'; // Replace with your ID

  async trackEvent(hitType: string, additionalParams?: Record<string, any>) {
    const data = {
      measurementId: this.measurementId,
      hitType,
      ...additionalParams,
    };
    await axios.post('https://www.google-analytics.com/collect', data);
  }
}