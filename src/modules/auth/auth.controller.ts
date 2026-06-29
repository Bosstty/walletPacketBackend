import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DevLoginDto } from './dto/dev-login.dto';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('dev-login')
  devLogin(@Body() body: DevLoginDto) {
    return this.authService.devLogin(body);
  }
}
