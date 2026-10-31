import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Button, EmptyState, ErrorText, Screen } from '../../components/ui';
import { money, newIdempotencyKey } from '../../lib/format';
import { useCharges, useCurrentBuilding, usePayCharge } from '../../lib/queries';
import type { ChargeStatus } from '../../lib/types';
import { fonts, palette } from '../../theme/tokens';

const filters: { value: ChargeStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'overdue', label: 'Vencidos' },
  { value: 'paid', label: 'Cobrados' },
];

// Lista de cobros. La creación vive en el modal nuevo-cobro, que se abre con el botón +.
export default function ChargesScreen() {
  const { building } = useCurrentBuilding();
  const [filter, setFilter] = useState<ChargeStatus | 'all'>('all');
  const charges = useCharges(building?.id, filter === 'all' ? undefined : filter);
  const pay = usePayCharge(building?.id);

  if (!building) {
    return (
      <Screen title="Cobros">
        <EmptyState title="Primero crea tu negocio" body="Desde Inicio puedes crearlo en un momento." />
      </Screen>
    );
  }

  return (
    <Screen
      eyebrow={building.name}
      title="Cobros"
      headerRight={
        <Pressable onPress={() => router.push('/nuevo-cobro')} accessibilityRole="button" accessibilityLabel="Nuevo cobro" style={styles.addBtn}>
          <Ionicons name="add" size={26} color={palette.ink} />
        </Pressable>
      }
    >
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

      {charges.data?.length === 0 ? <EmptyState title="Sin cobros en este filtro" body="Crea un cobro con el botón + o cambia el filtro." /> : null}

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
  addBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: palette.lime, alignItems: 'center', justifyContent: 'center' },
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
