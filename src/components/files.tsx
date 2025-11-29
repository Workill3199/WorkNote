import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
  StyleSheet,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { darkColors } from '../theme/colors';

export interface SelectedFile {
  uri: string;
  name: string;
  size?: number;
  type?: string;
  // Web only: mantener referencia al File para subir directamente
  fileRef?: File;
}

interface FileUploadProps {
  onFilesSelected?: (files: SelectedFile[]) => void;
  multiple?: boolean;
  maxFiles?: number;
}

export function FileUpload({
  onFilesSelected,
  multiple = true,
  maxFiles = 10,
}: FileUploadProps) {
  const [pendingFiles, setPendingFiles] = useState<SelectedFile[]>([]);
  const T = darkColors;

  function iconForType(type?: string) {
    const t = (type || '').toLowerCase();
    if (t.includes('pdf')) return 'file-pdf-box';
    if (t.includes('image')) return 'file-image';
    if (t.includes('zip') || t.includes('rar')) return 'folder-zip';
    if (t.includes('word') || t.includes('doc')) return 'file-word-box';
    if (t.includes('sheet') || t.includes('excel') || t.includes('xls')) return 'file-excel-box';
    if (t.includes('powerpoint') || t.includes('ppt')) return 'file-powerpoint-box';
    return 'file';
  }

  // --- Web file selection ---
  function handleWebFileSelection() {
    if (typeof document === 'undefined') return;
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = multiple;

    input.onchange = (e: any) => {
      const fileArray = (Array.from(e?.target?.files || []) as File[]);
      const files: SelectedFile[] = fileArray.map((f) => ({
        uri: URL.createObjectURL(f),
        name: f.name,
        size: f.size,
        type: f.type,
        fileRef: f,
      }));

      if (files.length > maxFiles) {
        Alert.alert('Error', `Solo puedes seleccionar hasta ${maxFiles} archivos`);
        return;
      }

      const newFiles = [...pendingFiles, ...files].slice(0, maxFiles);
      setPendingFiles(newFiles);
      onFilesSelected?.(newFiles);
    };

    try { input.click(); } catch {}
  }

  // --- Mobile file selection ---
  async function handleMobileFileSelection() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple,
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const selectedAssets = result.assets || [];

      if (selectedAssets.length > maxFiles) {
        Alert.alert('Error', `Solo puedes seleccionar hasta ${maxFiles} archivos`);
        return;
      }

      const files: SelectedFile[] = selectedAssets.map((asset) => ({
        uri: asset.uri,
        name: asset.name ?? 'archivo',
        size: asset.size,
        type: asset.mimeType ?? 'application/octet-stream',
      }));

      const newFiles = [...pendingFiles, ...files].slice(0, maxFiles);
      setPendingFiles(newFiles);
      onFilesSelected?.(newFiles);
    } catch (error) {
      console.error('Error al seleccionar archivos:', error);
      Alert.alert('Error', 'No se pudieron seleccionar los archivos');
    }
  }

  // --- Unified handler ---
  function handleFileSelection() {
    if (Platform.OS === 'web') handleWebFileSelection();
    else handleMobileFileSelection();
  }

  // --- Remove one ---
  function removeFile(index: number) {
    const newFiles = pendingFiles.filter((_, i) => i !== index);
    setPendingFiles(newFiles);
    onFilesSelected?.(newFiles);
  }

  // --- Clear all ---
  function clearAllFiles() {
    setPendingFiles([]);
    onFilesSelected?.([]);
  }

  // --- Render JSX ---
  return (
    <View>
      <View style={styles.container}>
        <TouchableOpacity
          onPress={handleFileSelection}
          style={[styles.chip, { backgroundColor: T.card, borderColor: T.border }]}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="cloud-upload" size={16} color={T.accent} />
          <Text style={[styles.chipText, { color: T.text }]}>Agregar archivos</Text>
        </TouchableOpacity>

        {pendingFiles.length > 0 && (
          <View style={[styles.chip, { marginLeft: 8, backgroundColor: T.card, borderColor: T.border }]}> 
            <MaterialCommunityIcons name="paperclip" size={16} color={T.accent} />
            <Text style={[styles.chipText, { color: T.text }]}>Seleccionados: {pendingFiles.length}</Text>
          </View>
        )}

        {pendingFiles.length > 0 && (
          <TouchableOpacity onPress={clearAllFiles} style={styles.clearAllButton}>
            <Text style={styles.clearAllText}>Limpiar</Text>
          </TouchableOpacity>
        )}
      </View>

      {pendingFiles.length > 0 && (
        <View style={styles.fileList}>
          {pendingFiles.map((file, index) => (
            <View key={index} style={[styles.fileItem, { borderColor: T.border, backgroundColor: T.card }] }>
              <View style={styles.fileInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons name={iconForType(file.type)} size={18} color={T.text} />
                  <Text style={[styles.fileName, { color: T.text }]} numberOfLines={1}>
                    {file.name}
                  </Text>
                </View>
                <Text style={[styles.fileSize, { color: T.mutedText }]}>
                  {file.size
                    ? `${(file.size / 1024).toFixed(1)} KB`
                    : 'Tamaño desconocido'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => removeFile(index)}
                style={styles.removeButton}
              >
                <MaterialCommunityIcons name="trash-can" size={18} color={T.error} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#000000',
  },
  fileList: {
    marginTop: 12,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginLeft: 6,
  },
  fileSize: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  removeButton: {
    padding: 4,
  },
  clearAllButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 8,
  },
  clearAllText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
