import { Text } from 'react-native';
import { Panel, Screen } from '@/components/screen';

export default function Notifications() {
  return (
    <Screen title="اعلان‌ها" subtitle="اعلان‌های پیشنهاد و وضعیت سفارش">
      <Panel>
        <Text style={{ textAlign: 'right', lineHeight: 24 }}>
          Push و صندوق اعلان سرور هنوز متصل نیستند؛ برای جلوگیری از نمایش رویدادهای ساختگی، در حال حاضر اعلان واقعی ندارید.
        </Text>
      </Panel>
    </Screen>
  );
}
