import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, EmptyState, ErrorText, Field, Hint, Screen } from '../../components/ui';
import { money, newIdempotencyKey } from '../../lib/format';
import { useCharges, useClients, useCreateCharge, useCurrentBuilding, usePayCharge } from '../../lib/queries';
import type { ChargeStatus } from '../../lib/types';
import { fonts, palette } from '../../theme/tokens';

const filters: { value: ChargeStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'overdue', label: 'Vencidos' },
  { value: 'paid', label: 'Cobrados' },
];

// Fecha de vencimiento por defecto: dentro de 7 días, en formato AAAA-MM-DD.
function defaultDueDate() {
  const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

export default function ChargesScreen() {
  const { building } = useCurrentBuilding();
  const clients = useClients(building?.id);
  const [filter, setFilter] = useState<ChargeStatus | 'all'>('all');
  const charges = useCharges(building?.id, filter === 'all' ? undefined : filter);
  const createCharge = useCreateCharge(building?.id);
  const pay = usePayCharge(building?.id);

  const [clientId, setClientId] = useState<string | null>(null);
  const [concept, setConcept] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(defaultDueDate());
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!building) {
    return (
      <Screen title="Cobros">
        <EmptyState title="Primero crea tu negocio" body="Desde Inicio puedes crearlo en un momento." />
      </Screen>
    );
  }

  const amountCents = Math.round(Number(amount.replace(',', '.')) * 100);
  const dueValid = /^\d{4}-\d{2}-\d{2}$/.test(dueDate);
  const canCreate = !!clientId && concept.trim().length > 0 && amountCents > 0 && dueValid;

  function onCreate() {
    if (!clientId) return;
    setFeedback(null);
    createCharge.mutate(
      { clientId, concept: concept.trim(), amountCents, dueDate },
      {
        onSuccess: () => {
          setConcept('');
          setAmount('');
          setFeedback('Cobro creado.');
        },
      },
    );
  }

  return (
    <Screen eyebrow={building.name} title="Cobros">
      <View style={styles.formCard}>
        <Text style={styles.heading}>Nuevo cobro</Text>
        {clients.data?.length === 0 ? (
          <Hint message="Primero agrega un cliente en la pestaña Clientes." tone="error" />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {clients.data?.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => setClientId(c.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: clientId === c.id }}
                style={[styles.chip, { backgroundColor: clientId === c.id ? palette.ink : palette.white }]}
              >
                <Text style={[styles.chipText, { color: clientId === c.id ? palette.white : palette.ink }]}>{c.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
        <Field placeholder="Concepto, p. ej. Diseño de logo" maxLength={120} value={concept} onChangeText={setConcept} />
        <Hint message={concept.trim() ? `${concept.length} de 120 caracteres` : 'Qué estás cobrando'} />
        <Field placeholder="Monto en soles" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
        <Hint message={amountCents > 0 ? `Se cobrará ${money(amountCents)}` : 'Escribe el monto, p. ej. 350.50'} tone={amountCents > 0 ? 'ok' : 'muted'} />
        <Field placeholder="Vencimiento AAAA-MM-DD" value={dueDate} onChangeText={setDueDate} />
        <Hint message={dueValid ? 'Fecha válida' : 'Usa el formato AAAA-MM-DD, p. ej. 2026-11-15'} tone={dueValid ? 'ok' : 'error'} />
        <ErrorText message={createCharge.error?.message} />
        {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
        <Button label="Crear cobro" loading={createCharge.isPending} disabled={!canCreate} onPress={onCreate} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {filters.map((f) => {
          const active = filter === f.value;
          return (
            <Pressable
              key={f.value}
              onPress={() => setFilter(f.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[styles.chip, { backgroundColor: active ? palette.ink : palette.white }]}
            >
              <Text style={[styles.chipText, { color: active ? palette.white : palette.ink }]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {charges.data?.length === 0 ? <EmptyState title="Sin cobros en este filtro" body="Crea un cobro o cambia el filtro." /> : null}

      {charges.data?.map((c) => {
        const bg = c.status === 'overdue' ? palette.coral : c.status === 'paid' ? palette.mint : palette.white;
        return (
          <View key={c.id} style={[styles.chargeCard, { backgroundColor: bg }]}>
            <View style={styles.between}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.chargeClient} numberOfLines={1}>
                  {c.clientName}
                </Text>
                <Text style={styles.chargeSub} numberOfLines={1}>
                  {c.concept} · vence {c.dueDate}
                </Text>
              </View>
              <Text style={styles.chargeAmount}>{money(c.remainingCents)}</Text>
            </View>
            {c.status !== 'paid' ? (
              <View style={styles.payRow}>
                <Text style={styles.chargeSub}>{c.status === 'overdue' ? 'Vencido' : 'Pendiente'}</Text>
                <View style={{ width: 130 }}>
                  <Button
                    label="Cobrar"
                    loading={pay.isPending && pay.variables?.chargeId === c.id}
                    onPress={() => pay.mutate({ chargeId: c.id, amountCents: c.remainingCents, idempotencyKey: newIdempotencyKey() })}
                  />
                </View>
              </View>
            ) : (
              <Text style={styles.chargeSub}>Cobrado</Text>
            )}
          </View>
        );
      })}
      <ErrorText message={pay.error?.message} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  formCard: { backgroundColor: palette.white, borderRadius: 30, padding: 20, gap: 10 },
  heading: { fontSize: 18, fontFamily: fonts.display, color: palette.ink },
  feedback: { color: '#0E6B52', fontFamily: fonts.bodyBold },
  chips: { gap: 8, paddingVertical: 4 },
  chip: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9 },
  chipText: { fontSize: 14, fontFamily: fonts.bodyBold },
  chargeCard: { borderRadius: 28, padding: 18, gap: 10 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  payRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chargeClient: { fontSize: 18, fontFamily: fonts.display, color: palette.ink },
  chargeSub: { fontSize: 13, fontFamily: fonts.body, color: palette.ink, opacity: 0.75 },
  chargeAmount: { fontSize: 20, fontFamily: fonts.num, color: palette.ink },
});
