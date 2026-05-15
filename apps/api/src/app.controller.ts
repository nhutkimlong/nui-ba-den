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
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta property="zalo-platform-site-verification" content="H_QoAeBoDWfXxBWnglvkQaFmkqYlXcqGDZKn" />
</head>
<body>
There Is No Limit To What You Can Accomplish Using Zalo!
</body>
</html>`;
  }
}
