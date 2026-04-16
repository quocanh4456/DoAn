import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RoutesModule } from './modules/routes/routes.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { BusesModule } from './modules/buses/buses.module';
import { TripsModule } from './modules/trips/trips.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ReportsModule } from './modules/reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_DATABASE'),
        entities: [__dirname + '/entities/*.entity{.ts,.js}'],
        synchronize: false,
      }),
    }),
    AuthModule,
    UsersModule,
    RoutesModule,
    SchedulesModule,
    BusesModule,
    TripsModule,
    TicketsModule,
    PaymentsModule,
    ReportsModule,
  ],
})
export class AppModule {}
