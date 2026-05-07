import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({ summary: 'Verifier que l API repond' })
  @ApiResponse({ status: 200, description: 'API disponible' })
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
