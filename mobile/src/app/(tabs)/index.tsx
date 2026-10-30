import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, EmptyState, ErrorText, Field, Hint, Screen, Txt } from '../../components/ui';
import { fonts, palette } from '../../theme/tokens';
import { supabase } from '../../lib/supabase';
import { money } from '../../lib/format';
import { useCharges, useCreateBuilding, useCurrentBuilding, useSummary } from '../../lib/queries';
import type { Charge } from '../../lib/types';

export default function HomeScreen() {
  const { building, isLoading } = useCurrentBuilding();

  if (isLoading) {
    return (
      <Screen title="PayTrack">
        <ActivityIndicator color={palette.ink} />
      </Screen>
    );
  }

  return building ? <Dashboard buildingId={building.id} name={building.name} address={building.address} /> : <CreateFirstBuilding />;
}

function Dashboard({ buildingId, name, address }: { buildingId: string; name: string; address: string }) {
  const { data: summary } = useSummary(buildingId);
  const { data: charges = [] } = useCharges(buildingId);
  const open = charges.filter((c) => c.status !== 'paid');
  const paid = charges.filter((c) => c.status === 'paid');

  return (
    <Screen eyebrow={address} title={name}>
      <View style={styles.hero}>
        <Txt style={styles.kicker}>Por cobrar</Txt>
        <Text style={styles.big}>{money(summary?.pendingCents ?? 0)}</Text>
        <Txt style={styles.muted}>
          {summary?.openCharges ?? 0} cobros abiertos · {money(summary?.overdueCents ?? 0)} vencidos
        </Txt>
        <View style={styles.heroBlob} />
        <Button label="Nuevo cobro" variant="ghost" onPress={() => router.push('/cobros')} />
      </View>

      <Text style={styles.sectionTitle}>Pendientes</Text>
      {open.length === 0 ? (
        <EmptyState title="Todo cobrado" body="No hay cobros pendientes. Crea uno desde la pestaña Cobros." />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tiles}>
          {open.map((c) => (
            <ChargeTile key={c.id} charge={c} />
          ))}
        </ScrollView>
      )}

      <Text style={styles.sectionTitle}>Cobrados</Text>
      {paid.length === 0 ? <Txt style={styles.muted}>Aún no hay cobros completos.</Txt> : null}
      {paid.map((c) => (
        <View key={c.id} style={styles.paidBar}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.paidTitle} numberOfLines={1}>
              {c.clientName}
            </Text>
            <Text style={styles.paidSub} numberOfLines={1}>
              {c.concept}
            </Text>
          </View>
          <Text style={styles.paidAmount}>{money(c.amountCents)}</Text>
        </View>
      ))}

      <Button label="Cerrar sesión" variant="ghost" onPress={() => supabase.auth.signOut()} />
    </Screen>
  );
}

// Tarjeta de color para un cobro pendiente. El color cambia según el estado.
function ChargeTile({ charge }: { charge: Charge }) {
  const overdue = charge.status === 'overdue';
  const bg = overdue ? palette.coral : palette.blue;
  const fg = palette.white;
  return (
    <View style={[styles.tile, { backgroundColor: bg }]}>
      <Text style={[styles.tileLabel, { color: fg }]} numberOfLines={2}>
        {charge.clientName}
      </Text>
      <View>
        <Text style={[styles.tileStatus, { color: fg }]}>{overdue ? 'Vencido' : 'Pendiente'}</Text>
        <Text style={[styles.tileAmount, { color: fg }]}>{money(charge.remainingCents)}</Text>
      </View>
    </View>
  );
}

function CreateFirstBuilding() {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const create = useCreateBuilding();

  return (
    <Screen eyebrow="Primer paso" title="Crea tu negocio">
      <View style={styles.formCard}>
        <Txt>Con tu negocio creado podrás agregar clientes y registrar cobros.</Txt>
        <Field placeholder="Nombre del negocio" maxLength={120} value={name} onChangeText={setName} />
        <Hint message={name.trim() ? `${name.length} de 120 caracteres` : 'Como lo conocen tus clientes'} />
        <Field placeholder="Dirección o ciudad" maxLength={200} value={address} onChangeText={setAddress} />
        <Hint message={address.trim() ? `${address.length} de 200 caracteres` : 'Dirección o ciudad, p. ej. Miraflores, Lima'} />
        <ErrorText message={create.error?.message} />
        <Button
          label="Crear negocio"
          loading={create.isPending}
          disabled={!name.trim() || !address.trim()}
          onPress={() => create.mutate({ name: name.trim(), address: address.trim() })}
        />
      </View>
      <Button label="Cerrar sesión" variant="ghost" onPress={() => supabase.auth.signOut()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: palette.ink,
    borderRadius: 36,
    padding: 24,
    gap: 6,
    overflow: 'hidden',
    marginTop: 8,
  },
  heroBlob: {
    position: 'absolute',
    right: -40,
    top: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: palette.yellow,
    opacity: 0.9,
  },
  kicker: { fontSize: 14, fontFamily: fonts.bodyMedium, color: palette.white, opacity: 0.8 },
  big: { fontSize: 56, lineHeight: 60, letterSpacing: -2, fontFamily: fonts.num, color: palette.lime },
  muted: { fontSize: 14, fontFamily: fonts.body, color: palette.ink, opacity: 0.7 },
  sectionTitle: { fontSize: 22, fontFamily: fonts.display, color: palette.ink, marginTop: 14, letterSpacing: -0.5 },
  tiles: { gap: 12, paddingRight: 16 },
  tile: { width: 180, height: 180, borderRadius: 32, padding: 18, justifyContent: 'space-between' },
  tileLabel: { fontSize: 19, fontFamily: fonts.display },
  tileStatus: { fontSize: 13, fontFamily: fonts.bodyBold, opacity: 0.9 },
  tileAmount: { fontSize: 24, fontFamily: fonts.num, letterSpacing: -0.5, marginTop: 2 },
  paidBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: palette.lime,
    borderRadius: 26,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  paidTitle: { fontSize: 17, fontFamily: fonts.bodyBold, color: palette.ink },
  paidSub: { fontSize: 13, fontFamily: fonts.body, color: palette.ink, opacity: 0.7 },
  paidAmount: { fontSize: 17, fontFamily: fonts.num, color: palette.ink },
  formCard: { backgroundColor: palette.white, borderRadius: 30, padding: 20, gap: 10 },
});
