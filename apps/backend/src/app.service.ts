import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'OPC backend is running. See /api/docs for Swagger.';
  }
}
