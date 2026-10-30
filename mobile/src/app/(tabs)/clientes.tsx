import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, EmptyState, ErrorText, Field, Hint, Screen } from '../../components/ui';
import { isValidEmail } from '../../lib/validation';
import { useClients, useCreateClient, useCurrentBuilding } from '../../lib/queries';
import { fonts, palette } from '../../theme/tokens';

export default function ClientsScreen() {
  const { building } = useCurrentBuilding();
  const clients = useClients(building?.id);
  const createClient = useCreateClient(building?.id);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  if (!building) {
    return (
      <Screen title="Clientes">
        <EmptyState title="Primero crea tu negocio" body="Desde Inicio puedes crearlo en un momento." />
      </Screen>
    );
  }

  const emailFilled = email.trim().length > 0;
  const emailValid = !emailFilled || isValidEmail(email);

  function onAdd() {
    createClient.mutate(
      { name: name.trim(), email: email.trim() || undefined, phone: phone.trim() || undefined },
      {
        onSuccess: () => {
          setName('');
          setEmail('');
          setPhone('');
        },
      },
    );
  }

  return (
    <Screen eyebrow={building.name} title="Clientes">
      <View style={styles.formCard}>
        <Text style={styles.heading}>Nuevo cliente</Text>
        <Field placeholder="Nombre del cliente" maxLength={120} value={name} onChangeText={setName} />
        <Hint message={name.trim() ? `${name.length} de 120 caracteres` : 'Quien va a pagarte'} />
        <Field placeholder="Correo (opcional)" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <Hint
          message={!emailFilled ? 'Opcional, para enviarle recordatorios' : emailValid ? 'Correo válido' : 'Falta el @ o el dominio'}
          tone={!emailFilled ? 'muted' : emailValid ? 'ok' : 'error'}
        />
        <Field placeholder="Teléfono (opcional)" keyboardType="phone-pad" maxLength={30} value={phone} onChangeText={setPhone} />
        <ErrorText message={createClient.error?.message} />
        <Button label="Guardar cliente" loading={createClient.isPending} disabled={!name.trim() || !emailValid} onPress={onAdd} />
      </View>

      {clients.data?.length === 0 ? <EmptyState title="Aún no tienes clientes" body="Agrega el primero para poder cobrarle." /> : null}

      {clients.data?.map((c) => (
        <View key={c.id} style={styles.clientRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{c.name.trim().charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.name} numberOfLines={1}>
              {c.name}
            </Text>
            <Text style={styles.sub} numberOfLines={1}>
              {c.email ?? c.phone ?? 'Sin contacto'}
            </Text>
          </View>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  formCard: { backgroundColor: palette.white, borderRadius: 30, padding: 20, gap: 10 },
  heading: { fontSize: 18, fontFamily: fonts.display, color: palette.ink },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: palette.white,
    borderRadius: 26,
    padding: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: palette.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontFamily: fonts.display, color: palette.ink },
  name: { fontSize: 17, fontFamily: fonts.bodyBold, color: palette.ink },
  sub: { fontSize: 13, fontFamily: fonts.body, color: palette.ink, opacity: 0.6 },
});

