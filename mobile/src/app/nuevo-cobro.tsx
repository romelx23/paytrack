import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, ErrorText, Field, Hint, Screen } from '../components/ui';
import { money } from '../lib/format';
import { useClients, useCreateCharge, useCurrentBuilding } from '../lib/queries';
import { fonts, palette } from '../theme/tokens';

// Fecha de vencimiento por defecto: dentro de 7 días, en formato AAAA-MM-DD.
function defaultDueDate() {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

// Se abre como modal desde Inicio o Cobros. Al crear el cobro, se cierra y vuelves a la pantalla anterior.
export default function NewChargeModal() {
  const { building } = useCurrentBuilding();
  const clients = useClients(building?.id);
  const createCharge = useCreateCharge(building?.id);

  const [clientId, setClientId] = useState<string | null>(null);
  const [concept, setConcept] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(defaultDueDate());

  const amountCents = Math.round(Number(amount.replace(',', '.')) * 100);
  const dueValid = /^\d{4}-\d{2}-\d{2}$/.test(dueDate);
  const canCreate = !!clientId && concept.trim().length > 0 && amountCents > 0 && dueValid;

  function onCreate() {
    if (!clientId) return;
    createCharge.mutate(
      { clientId, concept: concept.trim(), amountCents, dueDate },
      { onSuccess: () => router.back() },
    );
  }

  return (
    <Screen eyebrow={building?.name} title="Nuevo cobro" scroll>
      <View style={styles.formCard}>
        <Text style={styles.heading}>Cliente</Text>
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
                style={[styles.chip, { backgroundColor: clientId === c.id ? palette.ink : palette.mintSoft }]}
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
        <Button label="Crear cobro" loading={createCharge.isPending} disabled={!canCreate} onPress={onCreate} />
        <Button label="Cancelar" variant="ghost" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  formCard: { backgroundColor: palette.white, borderRadius: 30, padding: 20, gap: 10, marginTop: 8 },
  heading: { fontSize: 16, fontFamily: fonts.display, color: palette.ink },
  chips: { gap: 8, paddingVertical: 4 },
  chip: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9 },
  chipText: { fontSize: 14, fontFamily: fonts.bodyBold },
});
