import { Controller, Get, Header } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }

  @Get('zalo_verifierH_QoAeBoDWfXxBWnglvkQaFmkqYlXcqGDZKn.html')
  @Header('content-type', 'text/html; charset=utf-8')
  getZaloVerifier() {
    return 'zalo-platform-site-verification=H_QoAeBoDWfXxBWnglvkQaFmkqYlXcqGDZKn';
  }
}
