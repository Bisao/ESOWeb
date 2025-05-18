
import { useState, useEffect } from 'react';
import { useMMOGame } from '@/lib/stores/useMMOGame';
import { useMultiplayer } from '@/lib/stores/useMultiplayer';
import { Button } from '../button';
import { Input } from '../input';

interface GameLobby {
  id: string;
  hostName: string;
  playerCount: number;
}

export function LobbyScene() {
  const [lobbies, setLobbies] = useState<GameLobby[]>([]);
  const [lobbyName, setLobbyName] = useState('');
  const { playerName, setGamePhase, isHost } = useMMOGame();
  const { socket } = useMultiplayer();

  useEffect(() => {
    if (!socket) return;

    socket.on('lobbies', (lobbyList: GameLobby[]) => {
      setLobbies(lobbyList);
    });

    socket.emit('get-lobbies');

    return () => {
      socket.off('lobbies');
    };
  }, [socket]);

  const createLobby = () => {
    if (!socket || !lobbyName.trim()) return;
    socket.emit('create-lobby', { name: lobbyName, hostName: playerName });
  };

  const joinLobby = (lobbyId: string) => {
    if (!socket) return;
    socket.emit('join-lobby', { lobbyId });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-10">
      <div className="bg-slate-800 p-8 rounded-lg max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6 text-center">Game Lobby</h2>
        
        <div className="mb-6">
          <div className="flex gap-2">
            <Input
              placeholder="Lobby name"
              value={lobbyName}
              onChange={(e) => setLobbyName(e.target.value)}
            />
            <Button onClick={createLobby}>Create Lobby</Button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Available Lobbies</h3>
          {lobbies.length === 0 ? (
            <p className="text-gray-400">No lobbies available</p>
          ) : (
            lobbies.map((lobby) => (
              <div key={lobby.id} className="flex items-center justify-between bg-slate-700 p-4 rounded">
                <div>
                  <p className="font-medium">{lobby.hostName}'s Lobby</p>
                  <p className="text-sm text-gray-400">Players: {lobby.playerCount}</p>
                </div>
                <Button onClick={() => joinLobby(lobby.id)}>Join</Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
