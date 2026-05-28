import type { ThreeElements } from '@react-three/fiber'

// Module augmentation: extend JSX.IntrinsicElements with @react-three/fiber's elements
// so <mesh>, <ambientLight>, etc. work in JSX. Empty-body interface is required for
// this augmentation pattern.
declare module 'react/jsx-runtime' {
  namespace JSX {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface IntrinsicElements extends ThreeElements {}
  }
}
