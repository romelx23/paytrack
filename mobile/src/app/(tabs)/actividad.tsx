import { StyleSheet } from 'react-native';
import { Card, EmptyState, Screen, Txt } from '../../components/ui';
import { money } from '../../lib/format';
import { useCharges, useCurrentBuilding, useSummary } from '../../lib/queries';

export default function ActivityScreen() {
  const { building } = useCurrentBuilding();
  const summary = useSummary(building?.id);
  const paid = useCharges(building?.id, 'paid');

  if (!building) {
    return (
      <Screen title="Actividad">
        <EmptyState title="Primero crea un edificio" body="Desde Inicio puedes crear tu edificio." />
      </Screen>
    );
  }

  return (
    <Screen eyebrow="Este mes" title="Actividad">
      <Card tone="mint">
        <Txt style={styles.label}>Recaudado este mes</Txt>
        <Txt style={styles.big}>{money(summary.data?.collectedThisMonthCents ?? 0)}</Txt>
      </Card>

      <Txt style={styles.heading}>Cuotas cobradas</Txt>
      {paid.data?.length === 0 ? <EmptyState title="Sin cobros completos" body="Cuando cobres una cuota aparecerá aquí." /> : null}
      {paid.data?.map((c) => (
        <Card key={c.id}>
          <Txt style={styles.unit}>{c.unitLabel}</Txt>
          <Txt style={styles.muted}>
            {c.concept} · {c.period}
          </Txt>
          <Txt style={styles.amount}>{money(c.amountCents)}</Txt>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, opacity: 0.8 },
  big: { fontSize: 36, fontWeight: '800', letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  heading: { fontSize: 18, fontWeight: '800', marginTop: 6 },
  unit: { fontSize: 17, fontWeight: '800' },
  muted: { fontSize: 13, opacity: 0.7 },
  amount: { fontSize: 16, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
