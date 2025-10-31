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

export interface SelectedFile {
  uri: string;
  name: string;
  size?: number;
  type?: string;
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

  // --- Web file selection ---
  function handleWebFileSelection() {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = multiple;

    input.onchange = (e: any) => {
      const files: SelectedFile[] = Array.from(e?.target?.files || []).map(
        (f: File) => ({
          uri: URL.createObjectURL(f),
          name: f.name,
          size: f.size,
          type: f.type,
        })
      );

      if (files.length > maxFiles) {
        Alert.alert('Error', `Solo puedes seleccionar hasta ${maxFiles} archivos`);
        return;
      }

      const newFiles = [...pendingFiles, ...files].slice(0, maxFiles);
      setPendingFiles(newFiles);
      onFilesSelected?.(newFiles);
    };

    input.click();
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
          style={styles.chip}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="file-plus" size={16} color="#007AFF" />
          <Text style={styles.chipText}>Agregar archivos</Text>
        </TouchableOpacity>

        {pendingFiles.length > 0 && (
          <View style={[styles.chip, { marginLeft: 8 }]}>
            <MaterialCommunityIcons name="paperclip" size={16} color="#5856D6" />
            <Text style={styles.chipText}>Seleccionados: {pendingFiles.length}</Text>
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
            <View key={index} style={styles.fileItem}>
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {file.name}
                </Text>
                <Text style={styles.fileSize}>
                  {file.size
                    ? `${(file.size / 1024).toFixed(1)} KB`
                    : 'Tamaño desconocido'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => removeFile(index)}
                style={styles.removeButton}
              >
                <MaterialCommunityIcons name="close" size={20} color="#FF3B30" />
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
    flexDirection: 'col',
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
