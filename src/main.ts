import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as fs from 'fs'

async function bootstrap() {
  // const httpsOptions = {
  //   key: fs.readFileSync('./src/certificates/localhost-key.pem'),
  //   cert: fs.readFileSync('./src/certificates/localhost.pem'),
  // };
  const app = await NestFactory.create(AppModule,{
    // httpsOptions
  });
  app.enableCors({
    origin:'*'
  })
  app.use(cookieParser());
  await app.listen(process.env.PORT || 3000, ()=>{
    console.log('Server Connected')
  });
}
bootstrap();
