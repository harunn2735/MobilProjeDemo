/**
 * GameZoneScreen.js
 * 
 * 3 Premium Games:
 * 1. Uzay Gezgini - Classic dodger (Pan controls)
 * 2. Block Blast - Classic drag-and-place grid puzzle
 * 3. Araba Yarışı - Realistic endless runner with scrolling road
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions,
  Animated, StatusBar, PanResponder, ScrollView, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../../context/AppContext';
import { COLORS, SHADOWS, SPACING, RADIUS } from '../../constants/theme';

const { width: SW, height: SH } = Dimensions.get('window');

// --- CONSTANTS ---
const BOARD_SIZE = 8;
const CELL_SIZE = Math.floor((SW - 60) / BOARD_SIZE);
const BLOCK_COLORS = ['#FF4D4D', '#4D79FF', '#4DFF4D', '#FFD24D', '#FF4DFF', '#4DFFFF'];

const SHAPES = [
  { id: '1x1', pattern: [[1]] },
  { id: '2x1', pattern: [[1, 1]] },
  { id: '1x2', pattern: [[1], [1]] },
  { id: '2x2', pattern: [[1, 1], [1, 1]] },
  { id: '3x1', pattern: [[1, 1, 1]] },
  { id: '1x3', pattern: [[1], [1], [1]] },
  { id: 'L', pattern: [[1, 0], [1, 0], [1, 1]] },
  { id: 'J', pattern: [[0, 1], [0, 1], [1, 1]] },
];

export default function GameZoneScreen() {
  const navigation = useNavigation();
  const { addPoints, childProfile, points: totalPoints } = useApp();

  // --- TOP LEVEL STATE ---
  const [activeGame, setActiveGame] = useState(null); // 'space' | 'blocks' | 'race'
  const [phase, setPhase] = useState('menu'); // 'menu' | 'start' | 'playing' | 'end'
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120);
  const [highScores, setHighScores] = useState({ space: 0, blocks: 0, race: 0 });

  // Refs for logic (stale closure safety)
  const phaseRef = useRef('menu');
  const scoreRef = useRef(0);
  const gameRef = useRef(null);
  const loopRef = useRef(null);
  const timerRef = useRef(null);
  const speedRef = useRef(1);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { gameRef.current = activeGame; }, [activeGame]);

  useEffect(() => {
    loadHighScores();
    return () => stopAll();
  }, []);

  const loadHighScores = async () => {
    try {
      const saved = await AsyncStorage.getItem('buddy_game_scores');
      if (saved) setHighScores(JSON.parse(saved));
    } catch (e) {}
  };

  const saveHighScore = async (game, val) => {
    const newScores = { ...highScores, [game]: val };
    setHighScores(newScores);
    try {
      await AsyncStorage.setItem('buddy_game_scores', JSON.stringify(newScores));
    } catch (e) {}
  };

  const stopAll = () => {
    if (loopRef.current) clearInterval(loopRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    stopSpace();
    stopRace();
  };

  const endGame = () => {
    if (phaseRef.current === 'end') return;
    setPhase('end');
    stopAll();
    const g = gameRef.current;
    if (scoreRef.current > (highScores[g] || 0)) {
      saveHighScore(g, scoreRef.current);
    }
    // Award points based on performance
    if (scoreRef.current > 50) addPoints(scoreRef.current > 500 ? 20 : scoreRef.current > 200 ? 10 : 5);
  };

  // ===========================================================================
  // 1. SPACE TRAVELER
  // ===========================================================================
  const [spaceFallers, setSpaceFallers] = useState([]);
  const spaceFallersRef = useRef([]);
  const spaceX = useRef(new Animated.Value(SW / 2 - 25)).current;
  const spaceSpawnInt = useRef(null);
  const spaceLoopInt = useRef(null);

  const spacePan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => gameRef.current === 'space' && phaseRef.current === 'playing',
      onMoveShouldSetPanResponder: () => gameRef.current === 'space' && phaseRef.current === 'playing',
      onPanResponderMove: (_, g) => {
        let nx = g.moveX - 25;
        nx = Math.max(10, Math.min(SW - 60, nx));
        spaceX.setValue(nx);
      }
    })
  ).current;

  const startSpace = () => {
    setSpaceFallers([]);
    spaceFallersRef.current = [];
    spaceSpawnInt.current = setInterval(spawnSpaceItem, 800);
    spaceLoopInt.current = setInterval(checkSpaceCollisions, 50);
  };

  const stopSpace = () => {
    if (spaceSpawnInt.current) clearInterval(spaceSpawnInt.current);
    if (spaceLoopInt.current) clearInterval(spaceLoopInt.current);
  };

  const spawnSpaceItem = () => {
    const id = Math.random().toString();
    const isGood = Math.random() > 0.3;
    const x = Math.random() * (SW - 40);
    const anim = new Animated.Value(-50);
    const dur = 3000 / speedRef.current;

    const item = { id, isGood, x, anim };
    spaceFallersRef.current.push(item);
    setSpaceFallers([...spaceFallersRef.current]);

    Animated.timing(anim, {
      toValue: SH + 50,
      duration: dur,
      useNativeDriver: false,
      easing: Easing.linear,
    }).start(({ finished }) => {
      if (finished) removeSpaceItem(id);
    });
  };

  const removeSpaceItem = (id) => {
    spaceFallersRef.current = spaceFallersRef.current.filter(i => i.id !== id);
    setSpaceFallers([...spaceFallersRef.current]);
  };

  const checkSpaceCollisions = () => {
    const px = spaceX.__getValue();
    const py = SH - 140;
    spaceFallersRef.current.forEach(item => {
      const iy = item.anim.__getValue();
      const ix = item.x;
      if (iy > py - 30 && iy < py + 40) {
        if (ix + 40 > px && ix < px + 50) {
          if (item.isGood) {
            setScore(s => s + 10);
            removeSpaceItem(item.id);
          } else {
            endGame();
          }
        }
      }
    });
  };

  // ===========================================================================
  // 2. BLOCK BLAST (Drag & Place Style)
  // ===========================================================================
  const [board, setBoard] = useState(Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(null)));
  const [tray, setTray] = useState([]); // [{id, shape, color}]
  const [draggingBlock, setDraggingBlock] = useState(null); // {shape, color, startX, startY, currentPos: Animated.XY}
  const dragPos = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  const startBlocks = () => {
    setBoard(Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(null)));
    refreshTray();
  };

  const getRandomShape = () => {
    const s = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const c = BLOCK_COLORS[Math.floor(Math.random() * BLOCK_COLORS.length)];
    return { ...s, color: c, id: Math.random().toString() };
  };

  const refreshTray = () => {
    setTray([getRandomShape(), getRandomShape(), getRandomShape()]);
  };

  // Check if a shape can be placed at r, c
  const canFit = (currentBoard, shape, r, c) => {
    for (let i = 0; i < shape.pattern.length; i++) {
      for (let j = 0; j < shape.pattern[i].length; j++) {
        if (shape.pattern[i][j] === 1) {
          const nr = r + i;
          const nc = c + j;
          if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) return false;
          if (currentBoard[nr][nc] !== null) return false;
        }
      }
    }
    return true;
  };

  // Logic to clear rows/cols
  const clearMatches = (currentBoard) => {
    let rowsToClear = [];
    let colsToClear = [];

    for (let r = 0; r < BOARD_SIZE; r++) {
      if (currentBoard[r].every(c => c !== null)) rowsToClear.push(r);
    }
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (currentBoard.every(r => r[c] !== null)) colsToClear.push(c);
    }

    if (rowsToClear.length === 0 && colsToClear.length === 0) return currentBoard;

    const nextBoard = currentBoard.map(row => [...row]);
    rowsToClear.forEach(r => {
      for (let c = 0; c < BOARD_SIZE; c++) nextBoard[r][c] = null;
    });
    colsToClear.forEach(c => {
      for (let r = 0; r < BOARD_SIZE; r++) nextBoard[r][c] = null;
    });

    const clearedCount = rowsToClear.length + colsToClear.length;
    setScore(s => s + clearedCount * 100);
    return nextBoard;
  };

  const onDrop = (shape, x, y) => {
    // Basic hit-test: Grid is SW/2 centered roughly.
    // Let's calculate grid bounds.
    // Board is centered, approx from 30px left up to SW-30px.
    // y starts at 120px roughly.
    const gridTop = 120;
    const gridLeft = 30;

    const col = Math.floor((x - gridLeft) / CELL_SIZE);
    const row = Math.floor((y - gridTop) / CELL_SIZE);

    if (canFit(board, shape, row, col)) {
      const nextBoard = board.map(r => [...r]);
      shape.pattern.forEach((rowArr, i) => {
        rowArr.forEach((val, j) => {
          if (val === 1) nextBoard[row + i][col + j] = shape.color;
        });
      });

      const matchedBoard = clearMatches(nextBoard);
      setBoard(matchedBoard);
      setTray(t => t.filter(item => item.id !== shape.id));
      setScore(s => s + 10);
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (activeGame === 'blocks' && tray.length === 0 && phase === 'playing') {
      refreshTray();
    }
  }, [tray, activeGame, phase]);

  const blockPanResponder = (shape) => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: (e, g) => {
      setDraggingBlock({ shape, startX: g.x0, startY: g.y0 });
      dragPos.setValue({ x: 0, y: 0 });
    },
    onPanResponderMove: Animated.event([null, { dx: dragPos.x, dy: dragPos.y }], { useNativeDriver: false }),
    onPanResponderRelease: (e, g) => {
      const dropSuccess = onDrop(shape, g.moveX, g.moveY);
      setDraggingBlock(null);
      dragPos.setValue({ x: 0, y: 0 });
    }
  });

  // ===========================================================================
  // 3. REAL CAR RACE (Endless Runner)
  // ===========================================================================
  const [traffic, setTraffic] = useState([]);
  const trafficRef = useRef([]);
  const carX = useRef(new Animated.Value(SW / 2 - 25)).current;
  const carXRef = useRef(SW / 2 - 25);
  const roadScroll = useRef(new Animated.Value(0)).current;

  const startRace = () => {
    setTraffic([]);
    trafficRef.current = [];
    speedRef.current = 1.0;
    
    // Road animation
    Animated.loop(
      Animated.timing(roadScroll, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: false
      })
    ).start();

    loopRef.current = setInterval(() => {
      if (phaseRef.current === 'playing') {
        spawnTraffic();
        checkRaceCollisions();
      }
    }, 1200);

    const collCheck = setInterval(checkRaceCollisions, 50);
    timerRef.current = collCheck;
  };

  const stopRace = () => {
    roadScroll.stopAnimation();
  };

  const spawnTraffic = () => {
    const id = Math.random().toString();
    // Lanes: road is roughly 80% width
    const lanes = [SW * 0.2, SW * 0.4, SW * 0.6, SW * 0.8];
    const x = lanes[Math.floor(Math.random() * lanes.length)] - 25;
    const anim = new Animated.Value(-100);
    const dur = 2000 / speedRef.current;

    const item = { id, x, anim };
    trafficRef.current.push(item);
    setTraffic([...trafficRef.current]);

    Animated.timing(anim, {
      toValue: SH + 100,
      duration: dur,
      useNativeDriver: false,
      easing: Easing.linear
    }).start(({ finished }) => {
      if (finished) {
        trafficRef.current = trafficRef.current.filter(t => t.id !== id);
        setTraffic([...trafficRef.current]);
        setScore(s => s + 5);
      }
    });
  };

  const checkRaceCollisions = () => {
    const px = carXRef.current;
    const py = SH - 160;
    trafficRef.current.forEach(t => {
      const ty = t.anim.__getValue();
      const tx = t.x;
      if (ty > py - 50 && ty < py + 70) {
        if (tx + 50 > px && tx < px + 50) {
          endGame();
        }
      }
    });
  };

  const racePan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => gameRef.current === 'race' && phaseRef.current === 'playing',
      onPanResponderMove: (_, g) => {
        let nx = g.moveX - 25;
        // Limit to road bounds (approx 15% to 85%)
        nx = Math.max(SW * 0.15, Math.min(SW * 0.85 - 50, nx));
        carX.setValue(nx);
        carXRef.current = nx;
      }
    })
  ).current;

  // ===========================================================================
  // SHARED GAME ENGINE
  // ===========================================================================
  const startGame = (type) => {
    setPhase('playing');
    setActiveGame(type);
    setScore(0);
    scoreRef.current = 0;
    setTimeLeft(120);
    speedRef.current = 1.0;

    if (type === 'space') startSpace();
    if (type === 'blocks') startBlocks();
    if (type === 'race') startRace();

    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          endGame();
          return 0;
        }
        // Increase difficulty
        if (t % 15 === 0) speedRef.current += 0.15;
        return t - 1;
      });
    }, 1000);
    timerRef.current = timer;
  };

  // --- RENDER HELPERS ---
  const renderMenu = () => (
    <View style={s.menu}>
      <Text style={s.menuTitle}>🦁 Oyun Bölgesi</Text>
      <View style={s.statsRow}>
        <View style={s.statBox}>
          <Text style={s.statVal}>💰 {totalPoints}</Text>
          <Text style={s.statLab}>Toplam Puan</Text>
        </View>
        <View style={s.statBox}>
          <Text style={s.statVal}>🔥 {childProfile?.streak || 0}</Text>
          <Text style={s.statLab}>Seri (Gün)</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={[s.gameCard, { backgroundColor: '#FF4D4D' }]} 
        onPress={() => startGame('space')}
      >
        <Text style={s.gameEmoji}>🚀</Text>
        <View style={s.gameInfo}>
          <Text style={s.gameName}>Uzay Gezgini</Text>
          <Text style={s.gameDesc}>Göktaşlarından kaç, yıldız topla!</Text>
          <Text style={s.highScore}>Rekor: {highScores.space}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[s.gameCard, { backgroundColor: '#4D79FF' }]} 
        onPress={() => startGame('blocks')}
      >
        <Text style={s.gameEmoji}>🧩</Text>
        <View style={s.gameInfo}>
          <Text style={s.gameName}>Blok Yerleştir</Text>
          <Text style={s.gameDesc}>Blokları diz, satırları patlat!</Text>
          <Text style={s.highScore}>Rekor: {highScores.blocks}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[s.gameCard, { backgroundColor: '#10B981' }]} 
        onPress={() => startGame('race')}
      >
        <Text style={s.gameEmoji}>🏎️</Text>
        <View style={s.gameInfo}>
          <Text style={s.gameName}>Araba Yarışı</Text>
          <Text style={s.gameDesc}>Trafikle savaş, en uzağa git!</Text>
          <Text style={s.highScore}>Rekor: {highScores.race}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderHUD = () => (
    <View style={s.hud}>
      <TouchableOpacity onPress={() => { stopAll(); setPhase('menu'); }} style={s.backBtn}>
        <Ionicons name="close-circle" size={40} color="#fff" />
      </TouchableOpacity>
      <View style={s.hudMain}>
        <Text style={s.scoreText}>⭐ {score}</Text>
        <Text style={s.timerText}>⏳ {timeLeft}</Text>
      </View>
    </View>
  );

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        {phase === 'menu' && renderMenu()}
        
        {phase === 'playing' && (
          <View style={s.arena}>
            {renderHUD()}

            {/* SPACE GAME */}
            {activeGame === 'space' && (
              <View style={s.gameSpace} {...spacePan.panHandlers}>
                {spaceFallers.map(f => (
                  <Animated.View key={f.id} style={[s.faller, { left: f.x, transform: [{ translateY: f.anim }] }]}>
                    <Text style={{ fontSize: 30 }}>{f.isGood ? '⭐' : '☄️'}</Text>
                  </Animated.View>
                ))}
                <Animated.View style={[s.playerSpace, { transform: [{ translateX: spaceX }] }]}>
                  <Text style={{ fontSize: 50 }}>{childProfile?.avatar || '🦁'}</Text>
                </Animated.View>
              </View>
            )}

            {/* BLOCK BLAST */}
            {activeGame === 'blocks' && (
              <View style={s.gameBlocks}>
                <View style={s.grid}>
                  {board.map((row, ri) => (
                    <View key={ri} style={s.gridRow}>
                      {row.map((cell, ci) => (
                        <View key={ci} style={[s.cell, cell && { backgroundColor: cell }]}>
                          {!cell && <View style={s.cellDot} />}
                        </View>
                      ))}
                    </View>
                  ))}
                </View>

                <View style={s.tray}>
                  {tray.map(item => (
                    <View key={item.id} style={s.traySlot}>
                      <View {...blockPanResponder(item).panHandlers}>
                        <View style={s.trayShape}>
                          {item.pattern.map((rowArr, i) => (
                            <View key={i} style={{ flexDirection: 'row' }}>
                              {rowArr.map((val, j) => (
                                <View key={j} style={[s.miniCell, val === 1 ? { backgroundColor: item.color } : { backgroundColor: 'transparent' }]} />
                              ))}
                            </View>
                          ))}
                        </View>
                      </View>
                    </View>
                  ))}
                </View>

                {draggingBlock && (
                  <Animated.View 
                    style={[
                      s.draggingContainer, 
                      { 
                        transform: [
                          { translateX: dragPos.x }, 
                          { translateY: dragPos.y }
                        ] 
                      }
                    ]}
                    pointerEvents="none"
                  >
                    <View style={s.dragShape}>
                      {draggingBlock.shape.pattern.map((rowArr, i) => (
                        <View key={i} style={{ flexDirection: 'row' }}>
                          {rowArr.map((val, j) => (
                            <View key={j} style={[s.cell, val === 1 ? { backgroundColor: draggingBlock.shape.color, width: CELL_SIZE, height: CELL_SIZE } : { backgroundColor: 'transparent', width: CELL_SIZE, height: CELL_SIZE }]} />
                          ))}
                        </View>
                      ))}
                    </View>
                  </Animated.View>
                )}
                <Text style={s.gameTip}>Blokları tutup tahtaya sürükle! Tam sıraları patlatarak puan kazan.</Text>
              </View>
            )}

            {/* CAR RACE */}
            {activeGame === 'race' && (
              <View style={s.gameRace} {...racePan.panHandlers}>
                {/* Scrolling Road */}
                <View style={s.roadContainer}>
                  <View style={s.grass} />
                  <View style={s.road}>
                    {[...Array(6)].map((_, i) => (
                      <Animated.View 
                        key={i} 
                        style={[
                          s.roadLine, 
                          { 
                            top: roadScroll.interpolate({
                              inputRange: [0, 1],
                              outputRange: [i * 150 - 150, i * 150]
                            })
                          }
                        ]} 
                      />
                    ))}
                  </View>
                  <View style={s.grass} />
                </View>

                {traffic.map(t => (
                  <Animated.View key={t.id} style={[s.traffic, { left: t.x, transform: [{ translateY: t.anim }] }]}>
                    <Text style={{ fontSize: 40 }}>🚙</Text>
                  </Animated.View>
                ))}

                <Animated.View style={[s.car, { transform: [{ translateX: carX }] }]}>
                  <Text style={{ fontSize: 50 }}>🏎️</Text>
                </Animated.View>
              </View>
            )}
          </View>
        )}

        {phase === 'end' && (
          <View style={s.center}>
            <Text style={{ fontSize: 100 }}>🏁</Text>
            <Text style={s.endTitle}>Oyun Bitti!</Text>
            <Text style={s.finalScore}>Skorun: {score}</Text>
            <TouchableOpacity style={s.replayBtn} onPress={() => { stopAll(); setPhase('menu'); }}>
              <Text style={s.replayTxt}>Anasayfaya Dön</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E293B' },
  menu: { flex: 1, padding: 20 },
  menuTitle: { fontSize: 32, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 20 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 30, backgroundColor: 'rgba(255,255,255,0.1)', padding: 15, borderRadius: 20 },
  statBox: { alignItems: 'center' },
  statVal: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  statLab: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  gameCard: { flexDirection: 'row', padding: 20, borderRadius: 25, marginBottom: 15, alignItems: 'center', ...SHADOWS.md },
  gameEmoji: { fontSize: 40, marginRight: 20 },
  gameInfo: { flex: 1 },
  gameName: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  gameDesc: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  highScore: { fontSize: 12, fontWeight: 'bold', color: 'rgba(255,255,255,0.6)', marginTop: 5 },

  arena: { flex: 1 },
  hud: { flexDirection: 'row', alignItems: 'center', padding: 15, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
  backBtn: { marginRight: 15 },
  hudMain: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 20 },
  scoreText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  timerText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  endTitle: { fontSize: 36, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  finalScore: { fontSize: 24, color: '#CBD5E1', marginBottom: 40 },
  replayBtn: { backgroundColor: '#3B82F6', paddingHorizontal: 40, paddingVertical: 15, borderRadius: 30 },
  replayTxt: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  // Space
  gameSpace: { flex: 1, backgroundColor: '#020617' },
  faller: { position: 'absolute', width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  playerSpace: { position: 'absolute', bottom: 100, width: 50, height: 50, alignItems: 'center', justifyContent: 'center' },

  // Blocks
  gameBlocks: { flex: 1, backgroundColor: '#0F172A', alignItems: 'center', paddingTop: 80 },
  grid: { padding: 5, backgroundColor: '#1E293B', borderRadius: 10 },
  gridRow: { flexDirection: 'row' },
  cell: { width: CELL_SIZE, height: CELL_SIZE, margin: 1, borderRadius: 4, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center' },
  cellDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#475569' },
  tray: { flexDirection: 'row', marginTop: 40, width: SW, justifyContent: 'space-around', alignItems: 'center' },
  traySlot: { width: SW / 3, height: 100, justifyContent: 'center', alignItems: 'center' },
  trayShape: { padding: 5, transform: [{ scale: 0.6 }] },
  miniCell: { width: CELL_SIZE, height: CELL_SIZE, margin: 1, borderRadius: 4 },
  draggingContainer: { position: 'absolute', zIndex: 1000 },
  gameTip: { marginTop: 30, paddingHorizontal: 40, textAlign: 'center', color: '#64748B', fontSize: 13 },

  // Race
  gameRace: { flex: 1, backgroundColor: '#111827' },
  roadContainer: { ...StyleSheet.absoluteFillObject, flexDirection: 'row' },
  grass: { flex: 1, backgroundColor: '#064E3B' },
  road: { width: SW * 0.7, backgroundColor: '#374151', alignItems: 'center', overflow: 'hidden' },
  roadLine: { position: 'absolute', width: 8, height: 100, backgroundColor: '#FFF', opacity: 0.5 },
  traffic: { position: 'absolute', zIndex: 5 },
  car: { position: 'absolute', bottom: 120, zIndex: 10 },
});
