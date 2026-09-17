import { Alert, Linking, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useEffect, useState } from 'react';
import { faArrowLeft, faClipboardList, faFloppyDisk, faMapLocationDot, faPaperPlane, faPen, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { Client, createClientNote, deleteClient, deleteClientNote, getClientNotes, getClientOrders, Note, Order, updateClient } from '../src/api';
import { colors, styles } from '../src/theme';
import { ConfirmationModal } from './ConfirmationModal';
import { OrderCard } from './OrderCard';
import { OrderFormModal } from './OrderFormModal';

type ClientDetailsProps = { client: Client; onBack: () => void; onSelectOrder: (order: Order) => void; token: string };

export function ClientDetails({ client,   onBack, onSelectOrder, token }: ClientDetailsProps) {
  const [name, setName] = useState(client.name);
  const [email, setEmail] = useState(client.email || '');
  const [phoneValue, setPhoneValue] = useState(client.phone || '');
  const [address, setAddress] = useState(client.address || '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteText, setNoteText] = useState('');
  const [notesError, setNotesError] = useState('');
  const [notesLoading, setNotesLoading] = useState(true);
  const [addingNote, setAddingNote] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ type: 'client' | 'note'; note?: Note } | null>(null);
  const [createOrderVisible, setCreateOrderVisible] = useState(false);
  const phone = phoneValue.replace(/[^\d+]/g, '');

  useEffect(() => {
    Promise.all([getClientOrders(token, client.id), getClientNotes(token, client.id)])
      .then(([loadedOrders, loadedNotes]) => { setOrders(loadedOrders); setNotes(loadedNotes); })
      .catch((requestError) => setNotesError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar los datos del cliente'))
      .finally(() => setNotesLoading(false));
  }, [client.id, token]);

  const saveChanges = async () => {
    if (!name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    setError('');
    setSaving(true);
    try {
      const updatedClient = await updateClient(token, client.id, { name, email, phone: phoneValue, address });
      setName(updatedClient.name);
      setEmail(updatedClient.email || '');
      setPhoneValue(updatedClient.phone || '');
      setAddress(updatedClient.address || '');
      setEditing(false);
      Alert.alert('Cliente actualizado', 'Los cambios se guardaron correctamente.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo actualizar el cliente');
    } finally {
      setSaving(false);
    }
  };

  const removeClient = async () => {
    setError('');
    setDeleting(true);
    try {
      await deleteClient(token, client.id);
      onBack();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo eliminar el cliente');
      setDeleting(false);
    }
  };

  const confirmDelete = () => {
    setDeleteConfirmation({ type: 'client' });
  };

  const cancelEditing = () => {
    setName(client.name);
    setEmail(client.email || '');
    setPhoneValue(client.phone || '');
    setAddress(client.address || '');
    setError('');
    setEditing(false);
  };

  const openWhatsApp = () => {
    if (phone) Linking.openURL(`https://wa.me/${phone.replace('+', '')}`);
  };

  const openAddressInMaps = () => {
    const trimmedAddress = address.trim();
    if (trimmedAddress) Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmedAddress)}`);
  };

  const addNote = async () => {
    if (!noteText.trim()) return;
    setNotesError('');
    setAddingNote(true);
    try {
      const createdNote = await createClientNote(token, client.id, noteText);
      setNotes((currentNotes) => [createdNote, ...currentNotes]);
      setNoteText('');
    } catch (requestError) {
      setNotesError(requestError instanceof Error ? requestError.message : 'No se pudo agregar la nota');
    } finally {
      setAddingNote(false);
    }
  };

  const removeNote = (note: Note) => {
    setDeleteConfirmation({ type: 'note', note });
  };

  const handleOrderCreated = (order: Order) => {
    setOrders((currentOrders) => [...currentOrders, order]);
    setCreateOrderVisible(false);
  };

  const confirmDeletion = async () => {
    const confirmation = deleteConfirmation;
    setDeleteConfirmation(null);
    if (!confirmation) return;

    if (confirmation.type === 'client') {
      await removeClient();
      return;
    }

    if (!confirmation.note) return;
    try {
      await deleteClientNote(token, client.id, confirmation.note.id);
      setNotes((currentNotes) => currentNotes.filter((currentNote) => currentNote.id !== confirmation.note?.id));
    } catch (requestError) {
      setNotesError(requestError instanceof Error ? requestError.message : 'No se pudo eliminar la nota');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Pressable onPress={onBack} style={styles.backButton}>
        <View style={styles.buttonContent}>
          <FontAwesomeIcon color={styles.backText.color} icon={faArrowLeft} size={14} />
          <Text style={styles.backText}>Volver</Text>
        </View>
      </Pressable>
      <View style={styles.detailHeader}>
        <Text style={styles.eyebrow}>Detalle del cliente</Text>
        <View style={styles.nameRow}>
          <Text style={styles.title}>{name}</Text>
          {!editing ? <Pressable accessibilityLabel="Editar cliente" onPress={() => { setError(''); setEditing(true); }} style={styles.editIconButton}>
            <FontAwesomeIcon color={colors.accent} icon={faPen} size={17} />
          </Pressable> : null}
        </View>
      </View>
      <View>
        {editing ? <>
          <View style={styles.detailRow}>
            <View style={styles.detailRowInfoFull}>
              <Text style={styles.label}>Nombre</Text>
              <TextInput onChangeText={setName} style={[styles.input, styles.detailInput]} value={name} />
            </View>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailRowInfoFull}>
              <Text style={styles.label}>Teléfono</Text>
              <TextInput keyboardType="phone-pad" onChangeText={setPhoneValue} placeholder="Sin teléfono registrado" placeholderTextColor={colors.textMuted} style={[styles.input, styles.detailInput]} value={phoneValue} />
            </View>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailRowInfoFull}>
              <Text style={styles.label}>Email</Text>
              <TextInput autoCapitalize="none" keyboardType="email-address" onChangeText={setEmail} placeholder="Sin email registrado" placeholderTextColor={colors.textMuted} style={[styles.input, styles.detailInput]} value={email} />
            </View>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailRowInfoFull}>
              <Text style={styles.label}>Dirección</Text>
              <TextInput onChangeText={setAddress} placeholder="Sin dirección registrada" placeholderTextColor={colors.textMuted} style={[styles.input, styles.detailInput]} value={address} />
            </View>
          </View>
        </> : <>
          <View style={styles.detailRow}>
            <View style={styles.detailRowInfo}>
              <Text style={styles.label}>Teléfono</Text>
              <Text style={styles.detailValue}>{phoneValue || 'Sin teléfono registrado'}</Text>
            </View>
            <Pressable accessibilityLabel="Abrir WhatsApp" disabled={!phone} onPress={openWhatsApp} style={({ pressed }) => [styles.whatsappButton, pressed && styles.buttonPressed, !phone && styles.buttonDisabled]}>
              <FontAwesomeIcon color={styles.whatsappText.color} icon={faWhatsapp} size={20} />
            </Pressable>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailRowInfo}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.detailValue}>{email || 'Sin email registrado'}</Text>
            </View>
            <View style={styles.detailActionSlot} />
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailRowInfo}>
              <Text style={styles.label}>Dirección</Text>
              <Text style={styles.detailValue}>{address || 'Sin dirección registrada'}</Text>
            </View>
            <Pressable accessibilityLabel="Buscar dirección en Google Maps" disabled={!address.trim()} onPress={openAddressInMaps} style={({ pressed }) => [styles.mapsButton, pressed && styles.buttonPressed, !address.trim() && styles.buttonDisabled]}>
              <FontAwesomeIcon color={styles.mapsText.color} icon={faMapLocationDot} size={18} />
            </Pressable>
          </View>
        </>}
      </View>
      {editing ? <>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable disabled={saving || deleting} onPress={saveChanges} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
          <View style={styles.buttonContent}>
            <FontAwesomeIcon color={styles.buttonText.color} icon={faFloppyDisk} size={16} />
            <Text style={styles.buttonText}>{saving ? 'Guardando...' : 'Guardar cambios'}</Text>
          </View>
        </Pressable>
        <Pressable disabled={saving || deleting} onPress={cancelEditing} style={styles.secondaryButton}>
          <Text style={styles.secondaryText}>Cancelar</Text>
        </Pressable>
      </> : null}
      {!editing && error ? <Text style={styles.error}>{error}</Text> : null}
      {editing ? <Pressable disabled={saving || deleting} onPress={confirmDelete} style={styles.deleteButton}>
          <View style={styles.buttonContent}>
            <FontAwesomeIcon color={styles.deleteText.color} icon={faTrash} size={16} />
            <Text style={styles.deleteText}>{deleting ? 'Eliminando...' : 'Eliminar cliente'}</Text>
          </View>
        </Pressable> : null}
      <View style={styles.detailSection}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeading}>
          <FontAwesomeIcon color={colors.accent} icon={faClipboardList} size={18} />
          <Text style={styles.sectionTitle}>Pedidos ({orders.length})</Text>
          </View>
          <Pressable accessibilityLabel="Agregar pedido" onPress={() => setCreateOrderVisible(true)} style={({ pressed }) => [styles.addButton, pressed && styles.buttonPressed]}>
            <FontAwesomeIcon color={styles.addButtonText.color} icon={faPlus} size={16} />
          </Pressable>
        </View>
        {notesLoading ? <Text style={styles.empty}>Cargando pedidos...</Text> : orders.length ? orders.map((order) => (
          <OrderCard key={order.id} onPress={onSelectOrder} order={order} />
        )) : <Text style={styles.empty}>Este cliente todavía no tiene pedidos.</Text>}
      </View>
      <View style={styles.detailSection}>
        <Text style={styles.sectionTitle}>Notas ({notes.length})</Text>
        <View style={styles.noteComposer}>
          <TextInput multiline onChangeText={setNoteText} placeholder="Escribí una nota..." placeholderTextColor={colors.textMuted} style={styles.noteInput} value={noteText} />
          <Pressable accessibilityLabel="Enviar nota" disabled={addingNote || !noteText.trim()} onPress={addNote} style={({ pressed }) => [styles.noteAddButton, pressed && styles.buttonPressed, !noteText.trim() && styles.buttonDisabled]}>
            <FontAwesomeIcon color={styles.noteAddText.color} icon={faPaperPlane} size={16} />
          </Pressable>
        </View>
        {notesError ? <Text style={styles.error}>{notesError}</Text> : null}
        {!notesLoading && notes.length ? notes.map((note) => (
          <View key={note.id} style={styles.noteItem}>
            <View style={styles.noteCopy}>
              <Text style={styles.noteText}>{note.text}</Text>
              <Text style={styles.cardMeta}>{new Date(note.createdAt).toLocaleDateString('es-AR')}</Text>
            </View>
            <Pressable accessibilityLabel="Eliminar nota" onPress={() => removeNote(note)} style={styles.iconButton}>
              <FontAwesomeIcon color={colors.danger} icon={faTrash} size={15} />
            </Pressable>
          </View>
        )) : <Text style={styles.empty}>Todavía no hay notas para este cliente.</Text>}
      </View>
      <ConfirmationModal
        message={deleteConfirmation?.type === 'client' ? `¿Querés eliminar a ${name} y a sus pedidos asociados?` : '¿Querés eliminar esta nota?'}
        onCancel={() => setDeleteConfirmation(null)}
        onConfirm={confirmDeletion}
        title={deleteConfirmation?.type === 'client' ? 'Eliminar cliente' : 'Eliminar nota'}
        visible={deleteConfirmation !== null}
      />
      <OrderFormModal clients={[client]} initialClient={client} onCancel={() => setCreateOrderVisible(false)} onCreated={handleOrderCreated} token={token} visible={createOrderVisible} />
    </ScrollView>
  );
}