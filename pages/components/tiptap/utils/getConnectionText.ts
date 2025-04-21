interface CollabState {
  // Add properties as needed
  status?: string
}

export const getConnectionText = (collabState: CollabState) => {
  return 'Disconnected'
}
