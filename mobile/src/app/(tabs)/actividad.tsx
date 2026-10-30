import { StyleSheet, Text, View } from 'react-native';
import { EmptyState, Screen } from '../../components/ui';
import { money } from '../../lib/format';
import { useCharges, useCurrentBuilding, useSummary } from '../../lib/queries';
import { fonts, palette } from '../../theme/tokens';

export default function ActivityScreen() {
  const { building } = useCurrentBuilding();
  const summary = useSummary(building?.id);
  const paid = useCharges(building?.id, 'paid');

  if (!building) {
    return (
      <Screen title="Actividad">
        <EmptyState title="Primero crea tu negocio" body="Desde Inicio puedes crearlo en un momento." />
      </Screen>
    );
  }

  return (
    <Screen eyebrow="Este mes" title="Actividad">
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>Recaudado este mes</Text>
        <Text style={styles.heroAmount}>{money(summary.data?.collectedThisMonthCents ?? 0)}</Text>
      </View>

      <Text style={styles.heading}>Cobros completos</Text>
      {paid.data?.length === 0 ? <EmptyState title="Sin cobros completos" body="Cuando cobres un cobro aparecerá aquí." /> : null}
      {paid.data?.map((c) => (
        <View key={c.id} style={styles.row}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.name} numberOfLines={1}>
              {c.clientName}
            </Text>
            <Text style={styles.sub} numberOfLines={1}>
              {c.concept}
            </Text>
          </View>
          <Text style={styles.amount}>{money(c.amountCents)}</Text>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: palette.blue, borderRadius: 32, padding: 24, gap: 6 },
  heroLabel: { fontSize: 14, fontFamily: fonts.bodyMedium, color: palette.white, opacity: 0.85 },
  heroAmount: { fontSize: 44, fontFamily: fonts.num, color: palette.white, letterSpacing: -1 },
  heading: { fontSize: 20, fontFamily: fonts.display, color: palette.ink, marginTop: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: palette.lime,
    borderRadius: 26,
    padding: 18,
  },
  name: { fontSize: 17, fontFamily: fonts.bodyBold, color: palette.ink },
  sub: { fontSize: 13, fontFamily: fonts.body, color: palette.ink, opacity: 0.7 },
  amount: { fontSize: 18, fontFamily: fonts.num, color: palette.ink },
});
