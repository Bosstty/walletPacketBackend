import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DevLoginDto } from './dto/dev-login.dto';
import { AuthService } from './auth.service';
import { WechatPhoneLoginDto } from './dto/wechat-phone-login.dto';
import { WechatLoginDto } from './dto/wechat-login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('dev-login')
  devLogin(@Body() body: DevLoginDto) {
    return this.authService.devLogin(body);
  }

  @Post('wechat-login')
  wechatLogin(@Body() body: WechatLoginDto) {
    return this.authService.wechatLogin(body);
  }

  @Post('wechat-phone-login')
  wechatPhoneLogin(@Body() body: WechatPhoneLoginDto) {
    return this.authService.wechatPhoneLogin(body);
  }
}
