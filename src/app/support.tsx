import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { createSupportTicket, listSupportTickets } from '@/api/support';
import { describeError } from '@/api/errors';
import type { SupportTicketResponse, SupportTopic } from '@/api/types';
import { Panel, Screen, screenTheme } from '@/components/screen';
import { AppFonts } from '@/constants/theme';

const TOPICS: { value: SupportTopic; label: string }[] = [
  { value: 'delivery', label: 'تحویل' },
  { value: 'account', label: 'حساب' },
  { value: 'payment', label: 'پرداخت' },
  { value: 'other', label: 'سایر' },
];

export default function Support() {
  const [topic, setTopic] = useState<SupportTopic>('delivery');
  const [orderReference, setOrderReference] = useState('');
  const [message, setMessage] = useState('');
  const [tickets, setTickets] = useState<SupportTicketResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [submittedId, setSubmittedId] = useState('');

  const loadTickets = useCallback(async (signal?: AbortSignal) => {
    try {
      const result = await listSupportTickets(signal);
      if (!signal?.aborted) setTickets(result);
    } catch (caught) {
      if (!signal?.aborted) setError(describeError(caught));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      void loadTickets(controller.signal);
      return () => controller.abort();
    }, [loadTickets]),
  );

  const submit = async () => {
    if (saving) return;
    setError('');
    setSubmittedId('');
    if (message.trim().length < 10) {
      setError('لطفاً مشکل را با حداقل ۱۰ نویسه توضیح دهید.');
      return;
    }
    setSaving(true);
    try {
      const ticket = await createSupportTicket({
        topic,
        orderReference: orderReference.trim() || undefined,
        message: message.trim(),
      });
      setTickets((current) => [ticket, ...current]);
      setSubmittedId(ticket.id);
      setMessage('');
      setOrderReference('');
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen title="پشتیبانی" subtitle="موضوع را انتخاب کن تا درخواستت ثبت شود">
      <Panel>
        <Text style={styles.title}>موضوع درخواست</Text>
        <View style={styles.topics}>
          {TOPICS.map((item) => (
            <Pressable
              key={item.value}
              accessibilityRole="button"
              accessibilityState={{ selected: topic === item.value }}
              onPress={() => setTopic(item.value)}
              style={[styles.topic, topic === item.value && styles.topicSelected]}
            >
              <Text style={[styles.topicText, topic === item.value && styles.topicTextSelected]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>شماره سفارش (اختیاری)</Text>
          <TextInput
            value={orderReference}
            onChangeText={setOrderReference}
            placeholder="مثلاً HM-2048"
            placeholderTextColor={screenTheme.textSecondary}
            style={styles.input}
            textAlign="right"
            accessibilityLabel="شماره سفارش"
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>شرح درخواست</Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="مشکل یا سوالت را بنویس..."
            placeholderTextColor={screenTheme.textSecondary}
            style={[styles.input, styles.messageInput]}
            multiline
            maxLength={600}
            textAlign="right"
            textAlignVertical="top"
            accessibilityLabel="شرح درخواست پشتیبانی"
          />
          <Text style={styles.counter}>{message.length} / 600</Text>
        </View>
        {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
        {!!submittedId && <Text style={styles.success}>درخواست ثبت شد · {submittedId}</Text>}
        <Text style={styles.note}>در این نسخه، درخواست فقط در همین نشست ذخیره می‌شود و به تیم پشتیبانی ارسال نمی‌شود.</Text>
        <Pressable
          accessibilityRole="button"
          disabled={saving}
          onPress={() => void submit()}
          style={({ pressed }) => [styles.submit, pressed && styles.pressed]}
        >
          {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitText}>ثبت درخواست</Text>}
        </Pressable>
      </Panel>
      <Panel>
        <View style={styles.historyHeader}>
          <Text style={styles.title}>درخواست‌های اخیر</Text>
          {loading ? <ActivityIndicator size="small" color={screenTheme.primary} /> : null}
        </View>
        {tickets.slice(0, 4).map((ticket) => (
          <View key={ticket.id} style={styles.ticketRow}>
            <View style={styles.ticketIcon}>
              <Text style={styles.ticketIconText}>؟</Text>
            </View>
            <View style={styles.ticketInfo}>
              <Text style={styles.ticketTitle}>{TOPICS.find((item) => item.value === ticket.topic)?.label ?? 'سایر'} · {ticket.id}</Text>
              <Text numberOfLines={2} style={styles.ticketMessage}>{ticket.message}</Text>
            </View>
            <Text style={styles.ticketStatus}>ثبت شد</Text>
          </View>
        ))}
        {!loading && tickets.length === 0 ? <Text style={styles.empty}>درخواستی ثبت نشده است.</Text> : null}
      </Panel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: AppFonts.bold, fontSize: 15, color: screenTheme.text, textAlign: 'right' },
  topics: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 7 },
  topic: { minHeight: 38, paddingHorizontal: 12, borderWidth: 1, borderColor: screenTheme.border, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  topicSelected: { borderColor: screenTheme.primary, backgroundColor: screenTheme.primaryLight },
  topicText: { fontFamily: AppFonts.medium, fontSize: 12, color: screenTheme.textSecondary },
  topicTextSelected: { color: screenTheme.primary, fontFamily: AppFonts.semiBold },
  field: { gap: 6 },
  label: { fontFamily: AppFonts.medium, fontSize: 12, color: screenTheme.textSecondary, textAlign: 'right' },
  input: { minHeight: 44, borderWidth: 1, borderColor: screenTheme.border, borderRadius: 10, paddingHorizontal: 12, backgroundColor: '#FFFFFF', color: screenTheme.text, fontFamily: AppFonts.regular, fontSize: 13 },
  messageInput: { minHeight: 110, paddingTop: 10 },
  counter: { fontFamily: AppFonts.regular, fontSize: 10, color: screenTheme.textSecondary, textAlign: 'left' },
  error: { fontFamily: AppFonts.medium, fontSize: 12, lineHeight: 20, color: screenTheme.error, textAlign: 'right' },
  success: { fontFamily: AppFonts.medium, fontSize: 12, lineHeight: 20, color: screenTheme.success, textAlign: 'right' },
  note: { fontFamily: AppFonts.regular, fontSize: 11, lineHeight: 19, color: screenTheme.textSecondary, textAlign: 'right' },
  submit: { minHeight: 48, borderRadius: 10, backgroundColor: screenTheme.primary, alignItems: 'center', justifyContent: 'center' },
  submitText: { fontFamily: AppFonts.bold, fontSize: 14, color: '#FFFFFF' },
  pressed: { opacity: 0.75 },
  historyHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  ticketRow: { minHeight: 58, flexDirection: 'row-reverse', alignItems: 'center', gap: 9, borderTopWidth: StyleSheet.hairlineWidth, borderColor: screenTheme.border, paddingVertical: 8 },
  ticketIcon: { width: 32, height: 32, borderRadius: 11, backgroundColor: screenTheme.primaryLight, alignItems: 'center', justifyContent: 'center' },
  ticketIconText: { fontFamily: AppFonts.bold, color: screenTheme.primary },
  ticketInfo: { flex: 1, minWidth: 0 },
  ticketTitle: { fontFamily: AppFonts.semiBold, fontSize: 11, color: screenTheme.text, textAlign: 'right' },
  ticketMessage: { fontFamily: AppFonts.regular, fontSize: 11, color: screenTheme.textSecondary, textAlign: 'right', marginTop: 2 },
  ticketStatus: { fontFamily: AppFonts.medium, fontSize: 10, color: screenTheme.primary },
  empty: { fontFamily: AppFonts.regular, fontSize: 12, color: screenTheme.textSecondary, textAlign: 'right' },
});
