import { Module } from '@nestjs/common';
import { ZarinPalProvider } from './providers/zarinpal.provider';
import { PaymentGatewayRegistry } from './payment-gateway.registry';

@Module({
  providers: [ZarinPalProvider, PaymentGatewayRegistry],
  exports: [PaymentGatewayRegistry],
})
export class PaymentGatewayModule {}
