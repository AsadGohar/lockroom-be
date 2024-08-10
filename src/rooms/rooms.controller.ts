import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Request,
  UseGuards,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { RolesGuard } from 'src/guards/role.guard';
import { Roles } from 'src/guards/role.decorator';
import { UserRoleEnum } from 'src/types/enums';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  create(@Body() createRoomDto: CreateRoomDto) {
    return this.roomsService.create(createRoomDto);
  }

  @UseGuards(AuthGuard)
  @Post('user')
  findAll(
    @Body('organization_id') organization_id: string,
    @Request() request,
  ) {
    return this.roomsService.findAll(
      organization_id,
      request.decoded_data?.user_id,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roomsService.findOne(+id);
  }

  @UseGuards(AuthGuard)
  @UseGuards(RolesGuard)
  @Roles([UserRoleEnum.ADMIN, UserRoleEnum.OWNER])
  @Put('update-name')
  update(@Body('room_id') room_id: string, @Body('new_name') new_name: string) {
    return this.roomsService.updateName(room_id, new_name);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.roomsService.remove(id);
  }
}
