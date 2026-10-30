import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, EmptyState, ErrorText, Field, Hint, Screen, Txt } from '../../components/ui';
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
        <ActivityIndicator color={palette.mint} />
      </Screen>
    );
  }

  return building ? (
    <Dashboard buildingId={building.id} name={building.name} address={building.address} code={building.inviteCode} />
  ) : (
    <CreateFirstBuilding />
  );
}

function Dashboard({ buildingId, name, address, code }: { buildingId: string; name: string; address: string; code: string }) {
  const { data: summary } = useSummary(buildingId);
  const { data: charges = [] } = useCharges(buildingId);
  const open = charges.filter((c) => c.status !== 'paid');
  const paid = charges.filter((c) => c.status === 'paid');

  return (
    <Screen eyebrow={address} title={name}>
      <View style={styles.hero}>
        <Txt style={styles.kicker}>Total por cobrar</Txt>
        <Text style={styles.big}>{money(summary?.pendingCents ?? 0)}</Text>
        <Txt style={styles.muted}>
          {summary?.openCharges ?? 0} cargos abiertos · {money(summary?.overdueCents ?? 0)} vencidos
        </Txt>
      </View>

      <SectionTitle>Por cobrar</SectionTitle>
      {open.length === 0 ? (
        <EmptyState title="Todo al día" body="No hay cobros pendientes. Genera las cuotas desde la pestaña Cobros." />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tiles}>
          {open.map((c) => (
            <ChargeTile key={c.id} charge={c} />
          ))}
        </ScrollView>
      )}

      <SectionTitle>Cobrados</SectionTitle>
      {paid.length === 0 ? <Txt style={styles.muted}>Aún no hay cobros completos.</Txt> : null}
      {paid.map((c) => (
        <View key={c.id} style={styles.paidBar}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.paidTitle} numberOfLines={1}>
              {c.unitLabel}
            </Text>
            <Text style={styles.paidSub} numberOfLines={1}>
              {c.concept} · {c.period}
            </Text>
          </View>
          <Text style={styles.paidAmount}>{money(c.amountCents)}</Text>
        </View>
      ))}

      <Card>
        <Txt style={styles.kicker}>Código del edificio</Txt>
        <Txt style={styles.code} selectable>
          {code}
        </Txt>
        <Txt style={styles.muted}>Los vecinos usarán este código, o su QR, para unirse. Próximamente.</Txt>
      </Card>

      <Button label="Cerrar sesión" variant="ghost" onPress={() => supabase.auth.signOut()} />
    </Screen>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

// Tarjeta de color que muestra un cobro pendiente. El color depende de si está vencido.
function ChargeTile({ charge }: { charge: Charge }) {
  const overdue = charge.status === 'overdue';
  const bg = overdue ? palette.coral : palette.blue;
  const fg = overdue ? palette.ink : palette.white;
  return (
    <View style={[styles.tile, { backgroundColor: bg }]}>
      <Text style={[styles.tileLabel, { color: fg }]} numberOfLines={1}>
        {charge.unitLabel}
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
    <Screen eyebrow="Primer paso" title="Crea tu cuenta">
      <Card>
        <Txt>Con el edificio creado podrás agregar departamentos y generar las cuotas del mes.</Txt>
        <View style={styles.form}>
          <Field placeholder="Nombre, p. ej. Edificio Los Álamos" maxLength={120} value={name} onChangeText={setName} />
          <Hint message={name.trim() ? `${name.length} de 120 caracteres` : 'Escribe el nombre con el que lo reconocerán los vecinos'} />
          <Field placeholder="Dirección" maxLength={200} value={address} onChangeText={setAddress} />
          <Hint message={address.trim() ? `${address.length} de 200 caracteres` : 'Calle y número, p. ej. Av. Javier Prado 1234'} />
          <ErrorText message={create.error?.message} />
          <Button
            label="Crear"
            loading={create.isPending}
            disabled={!name.trim() || !address.trim()}
            onPress={() => create.mutate({ name: name.trim(), address: address.trim() })}
          />
        </View>
      </Card>
      <Button label="Cerrar sesión" variant="ghost" onPress={() => supabase.auth.signOut()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: 6, marginTop: 8 },
  kicker: { fontSize: 13, fontFamily: fonts.bodyMedium, opacity: 0.8 },
  big: { fontSize: 60, lineHeight: 64, letterSpacing: -2, fontFamily: fonts.num, color: palette.mint },
  muted: { fontSize: 14, opacity: 0.7 },
  sectionTitle: { fontSize: 22, fontFamily: fonts.display, color: palette.white, marginTop: 14, letterSpacing: -0.5 },
  tiles: { gap: 12, paddingRight: 16 },
  tile: {
    width: 190,
    height: 190,
    borderRadius: 32,
    padding: 18,
    justifyContent: 'space-between',
  },
  tileLabel: { fontSize: 20, fontFamily: fonts.display },
  tileStatus: { fontSize: 13, fontFamily: fonts.bodyBold, opacity: 0.85 },
  tileAmount: { fontSize: 26, fontFamily: fonts.num, letterSpacing: -0.5, marginTop: 2 },
  paidBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: palette.mint,
    borderRadius: 26,
    paddingHorizontal: 20,
    paddingVertical: 16,
    minWidth: 0,
  },
  paidTitle: { fontSize: 17, fontFamily: fonts.bodyBold, color: palette.ink },
  paidSub: { fontSize: 13, fontFamily: fonts.body, color: palette.ink, opacity: 0.7 },
  paidAmount: { fontSize: 17, fontFamily: fonts.num, color: palette.ink },
  code: { fontSize: 24, fontFamily: fonts.num, letterSpacing: 2, color: palette.lime },
  form: { gap: 10, marginTop: 10 },
});
