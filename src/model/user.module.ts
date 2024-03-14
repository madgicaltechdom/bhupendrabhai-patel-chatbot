// user.module.ts

import { Module } from '@nestjs/common';
import { User } from './user.entity';
import { UserService } from './user.service';

@Module({
  imports: [],
  providers: [UserService],
  exports: [UserService], // Export the UserService to make it available for other modules
})
export class UserModule {}
