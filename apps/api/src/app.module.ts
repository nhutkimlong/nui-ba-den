import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ContentController } from './content.controller';
import { ReportsController } from './reports.controller';
import { ChatbotController } from './chatbot.controller';
import { GamificationController } from './gamification.controller';
import { AdminController } from './admin.controller';
import { AdminAuthController } from './admin-auth.controller';
import { AdminContentController } from './admin-content.controller';
import { AdminGovernanceController } from './admin-governance.controller';
import { AdminUsersController } from './admin-users.controller';
import { AuthController } from './auth.controller';

@Module({
  imports: [],
  controllers: [
    AppController,
    ContentController,
    ReportsController,
    ChatbotController,
    GamificationController,
    AdminController,
    AdminAuthController,
    AdminContentController,
    AdminGovernanceController,
    AdminUsersController,
    AuthController,
  ],
  providers: [AppService],
})
export class AppModule {}
