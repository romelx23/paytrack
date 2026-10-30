import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, EmptyState, ErrorText, Field, Pill, Screen, Txt } from '../../components/ui';
import { currentPeriod, money, newIdempotencyKey } from '../../lib/format';
import { useCharges, useCurrentBuilding, useGenerateCharges, usePayCharge } from '../../lib/queries';
import type { ChargeStatus } from '../../lib/types';
import { palette, useTheme } from '../../theme/tokens';

const filters: { value: ChargeStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'overdue', label: 'Vencidos' },
  { value: 'paid', label: 'Cobrados' },
];

export default function ChargesScreen() {
  const t = useTheme();
  const { building } = useCurrentBuilding();
  const [filter, setFilter] = useState<ChargeStatus | 'all'>('all');
  const charges = useCharges(building?.id, filter === 'all' ? undefined : filter);
  const generate = useGenerateCharges(building?.id);
  const pay = usePayCharge(building?.id);

  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('10');
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!building) {
    return (
      <Screen title="Cobros">
        <EmptyState title="Primero crea un edificio" body="Desde Inicio puedes crear tu edificio y luego generar cuotas." />
      </Screen>
    );
  }

  const amountCents = Math.round(Number(amount.replace(',', '.')) * 100);

  function onGenerate() {
    setFeedback(null);
    generate.mutate(
      { period: currentPeriod(), concept: 'Mantenimiento', amountCents, dueDay: Number(dueDay) },
      {
        onSuccess: (res) => setFeedback(res.created > 0 ? `Se generaron ${res.created} cuotas.` : 'Las cuotas de este mes ya existían.'),
      },
    );
  }

  return (
    <Screen eyebrow={building.name} title="Cobros">
      <Card>
        <Txt style={styles.label}>Generar cuotas de {currentPeriod()}</Txt>
        <View style={styles.row}>
          <View style={{ flex: 2 }}>
            <Field placeholder="Monto en soles" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
          </View>
          <View style={{ flex: 1 }}>
            <Field placeholder="Día" keyboardType="number-pad" value={dueDay} onChangeText={setDueDay} />
          </View>
        </View>
        <ErrorText message={generate.error?.message} />
        {feedback ? <Txt style={{ color: palette.mint }}>{feedback}</Txt> : null}
        <Button
          label="Generar cuotas"
          loading={generate.isPending}
          disabled={!(amountCents > 0) || !(Number(dueDay) >= 1 && Number(dueDay) <= 28)}
          onPress={onGenerate}
        />
      </Card>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {filters.map((f) => {
          const active = filter === f.value;
          return (
            <Pressable
              key={f.value}
              onPress={() => setFilter(f.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[styles.chip, { borderColor: t.line, backgroundColor: active ? t.inverse : t.surface }]}
            >
              <Txt style={{ color: active ? t.inverseFg : t.fg, fontWeight: '500' }}>{f.label}</Txt>
            </Pressable>
          );
        })}
      </ScrollView>

      {charges.isLoading ? <Txt style={{ color: t.muted }}>Cargando cobros…</Txt> : null}
      {charges.data?.length === 0 ? (
        <EmptyState title="Sin cobros en este filtro" body="Cambia el filtro o genera las cuotas del mes." />
      ) : null}

      {charges.data?.map((c) => (
        <Card key={c.id}>
          <View style={styles.between}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Txt style={styles.unit} numberOfLines={1}>
                {c.unitLabel}
              </Txt>
              <Txt style={styles.muted}>
                {c.concept} · {c.period} · vence {c.dueDate}
              </Txt>
            </View>
            <Txt style={styles.amount}>{money(c.remainingCents)}</Txt>
          </View>
          <View style={styles.between}>
            <Pill status={c.status} />
            {c.status !== 'paid' ? (
              <View style={{ width: 130 }}>
                <Button
                  label="Cobrar"
                  loading={pay.isPending && pay.variables?.chargeId === c.id}
                  onPress={() =>
                    pay.mutate({ chargeId: c.id, amountCents: c.remainingCents, idempotencyKey: newIdempotencyKey() })
                  }
                />
              </View>
            ) : null}
          </View>
        </Card>
      ))}
      <ErrorText message={pay.error?.message} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 15, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 10 },
  chips: { gap: 8, paddingVertical: 4 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  unit: { fontSize: 17, fontWeight: '800' },
  muted: { fontSize: 13, opacity: 0.7 },
  amount: { fontSize: 18, fontWeight: '800', fontVariant: ['tabular-nums'] },
});
