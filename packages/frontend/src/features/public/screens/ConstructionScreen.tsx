import { Text, View } from 'react-native';
import { styles } from '../../../shared';

export function ConstructionScreen() {
  return <View style={[styles.screen, styles.constructionScreen]}>
    <Text style={styles.eyebrow}>Eldavo</Text>
    <Text style={styles.title}>Web en construcción</Text>
    <Text style={styles.subtitle}>Lo bueno está por llegar!</Text>
  </View>;
}
