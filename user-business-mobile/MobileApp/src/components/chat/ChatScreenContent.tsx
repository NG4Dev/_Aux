import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome6 } from '@expo/vector-icons';
import { useAction } from 'convex/react';
import MessageInput from '@/components/chat/MessageInput';
import ChatMessage from '@/components/chat/ChatMessage';
import MessageIdeas from '@/components/chat/MessageIdeas';
import SourceApprovalSheet from '@/components/chat/SourceApprovalSheet';
import RecommendationCarousel from '@/components/chat/RecommendationCarousel';
import { getDefaultAssistantModel } from '@/config/features';
import {
  Message,
  Role,
  type AssistantMode,
  type ModelChoice,
  type ProductCard,
} from '@/services/aiChat';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import {
  assistantError,
  assistantLog,
  assistantWarn,
} from '@/services/assistantFlowLogger';

function formatAssistantError(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes('deployment_scaling_up') ||
    lower.includes('scaling up') ||
    lower.includes('scaled to zero') ||
    lower.includes('starting up on fireworks')
  ) {
    return 'Gemma is waking up. Wait a moment and try again.';
  }
  if (lower.includes('connection lost while action was in flight')) {
    return 'Gemma is still starting — keep the app open and try again.';
  }
  return message;
}

function isRetriableAssistantError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('deployment_scaling_up') ||
    lower.includes('scaling up') ||
    lower.includes('scaled to zero') ||
    lower.includes('starting up on fireworks') ||
    lower.includes('waking up') ||
    lower.includes('connection lost while action was in flight')
  );
}

export default function ChatScreenContent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [height, setHeight] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingSlowHint, setLoadingSlowHint] = useState(false);
  const [modelChoice, setModelChoice] = useState<ModelChoice>(getDefaultAssistantModel);
  const [assistantMode, setAssistantMode] = useState<AssistantMode | null>(null);
  const [approval, setApproval] = useState<{
    sessionId: Id<'assistantSessions'>;
    preamble: string;
    candidates: ProductCard[];
  } | null>(null);
  const flashListRef = useRef<any>(null);

  const getAssistantMode = useAction(api.assistant.getMode);
  const warmGemma = useAction(api.assistant.warmGemma);
  const chatAssistant = useAction(api.assistant.chat);
  const searchAssistant = useAction(api.assistant.search);
  const synthesizeAssistant = useAction(api.assistant.synthesize);

  const refreshMode = useCallback(async () => {
    try {
      assistantLog('ChatScreen', 'getMode.start');
      const result = await getAssistantMode({});
      setAssistantMode(result.mode);
      assistantLog('ChatScreen', 'getMode.ok', {
        mode: result.mode,
        ragHealthy: result.ragHealthy,
      });
    } catch (error) {
      assistantWarn('ChatScreen', 'getMode.fallback', { error: String(error) });
      setAssistantMode('agent');
    }
  }, [getAssistantMode]);

  useEffect(() => {
    void refreshMode();
  }, [refreshMode]);

  useEffect(() => {
    if (modelChoice !== 'gemma-fireworks') return;
    assistantLog('ChatScreen', 'warmGemma.start');
    void warmGemma({})
      .then((result) => {
        assistantLog('ChatScreen', 'warmGemma.done', result);
      })
      .catch((error) => {
        assistantWarn('ChatScreen', 'warmGemma.failed', { error: String(error) });
      });
  }, [modelChoice, warmGemma]);

  useEffect(() => {
    if (!loading) {
      setLoadingSlowHint(false);
      return;
    }
    const timer = setTimeout(() => setLoadingSlowHint(true), 3_000);
    return () => clearTimeout(timer);
  }, [loading]);

  const appendCarousel = (
    answer: string,
    items: ProductCard[],
    chips: string[],
    followUps: string[],
    preamble?: string,
  ) => {
    const carouselMessage: Message = {
      role: Role.Bot,
      type: 'carousel',
      preamble: preamble ?? '',
      content: answer,
      items,
      chips,
      followUps,
    };
    setMessages((prev) => [...prev, carouselMessage]);
  };

  const handleAgentMessage = async (text: string, imageUrl?: string) => {
    assistantLog('ChatScreen', 'chat.start', { modelChoice, queryLen: text.length });
    const started = Date.now();
    const result = await chatAssistant({
      query: text,
      imageUrl,
      modelChoice,
    });
    assistantLog('ChatScreen', 'chat.ok', {
      modelChoice,
      latencyMs: Date.now() - started,
      productCount: result.productCards.length,
      answerLen: result.answer.length,
    });
    appendCarousel(
      result.answer,
      result.productCards,
      result.refinementChips,
      result.followUps,
    );
  };

  const handleHitlMessage = async (text: string, imageUrl?: string) => {
    assistantLog('ChatScreen', 'search.start', { queryLen: text.length });
    const result = await searchAssistant({
      query: text,
      imageUrl,
    });
    assistantLog('ChatScreen', 'search.ok', { candidateCount: result.candidates.length });
    if (result.candidates.length === 0) {
      setMessages((prev) => [
        ...prev,
        {
          role: Role.Bot,
          type: 'text',
          content:
            "I couldn't find close matches in the menu corpus. Try a dish name like patatas bravas or sangria.",
        },
      ]);
      return;
    }
    const approvalMessage: Message = {
      role: Role.Bot,
      type: 'approval',
      sessionId: result.sessionId,
      preamble: result.preamble,
      candidates: result.candidates,
    };
    setMessages((prev) => [...prev, approvalMessage]);
    setApproval({
      sessionId: result.sessionId,
      preamble: result.preamble,
      candidates: result.candidates,
    });
  };

  const handleSendMessage = async (text: string, imageUrl?: string) => {
    if (loading) return;

    const userMessage: Message = { role: Role.User, content: text, imageUrl };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    const mode = assistantMode ?? 'agent';
    let lastError: unknown;

    try {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          assistantLog('ChatScreen', 'send.start', { mode, modelChoice, attempt });
          if (mode === 'agent') {
            await handleAgentMessage(text, imageUrl);
          } else {
            await handleHitlMessage(text, imageUrl);
          }
          return;
        } catch (error) {
          lastError = error;
          const message =
            error instanceof Error ? error.message : 'Assistant request failed';
          if (attempt === 0 && isRetriableAssistantError(message)) {
            assistantWarn('ChatScreen', 'send.retry', { attempt, message });
            await new Promise((resolve) => setTimeout(resolve, 4_000));
            continue;
          }
          throw error;
        }
      }
      throw lastError;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Assistant request failed";
      const friendly = formatAssistantError(message);
      assistantError('ChatScreen', 'send.failed', error, {
        mode: assistantMode ?? 'agent',
        modelChoice,
      });
      setMessages((prev) => [
        ...prev,
        {
          role: Role.Bot,
          type: 'text',
          content:
            assistantMode === 'hitl'
              ? `Search failed: ${friendly}`
              : `Assistant failed: ${friendly}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmApproval = async (
    approvedChunkIds: string[],
    approvedProductIds: string[],
  ) => {
    if (!approval) return;
    setApproval(null);
    setLoading(true);
    try {
      const result = await synthesizeAssistant({
        sessionId: approval.sessionId,
        approvedChunkIds,
        approvedProductIds,
        modelChoice,
      });
      appendCarousel(
        result.answer,
        result.productCards,
        result.refinementChips,
        result.followUps,
        approval.preamble,
      );
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: Role.Bot,
          type: 'text',
          content:
            modelChoice === 'gemma-fireworks'
              ? 'Synthesis failed. Check Fireworks API key on Convex.'
              : 'Synthesis failed. Check AMD inference is running.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleModel = () => {
    setModelChoice((m) => (m === 'qwen-amd' ? 'gemma-fireworks' : 'qwen-amd'));
  };

  const onLayout = (event: any) => {
    const { height: h } = event.nativeEvent.layout;
    setHeight(h / 2);
  };

  const modeLabel =
    assistantMode === 'hitl'
      ? 'HITL + RAG'
      : assistantMode === 'agent'
        ? 'Agent'
        : '…';

  const renderItem = ({ item }: { item: Message }) => {
    if (item.role === Role.User) {
      return (
        <ChatMessage content={item.content} role={item.role} imageUrl={item.imageUrl} />
      );
    }
    if (item.type === 'carousel') {
      return (
        <View style={styles.botRow}>
          <RecommendationCarousel
            preamble={item.preamble}
            answer={item.content}
            items={item.items}
            chips={item.chips}
            followUps={item.followUps}
            onChipPress={(chip) => handleSendMessage(chip)}
            onFollowUpPress={(text) => handleSendMessage(text)}
          />
        </View>
      );
    }
    if (item.type === 'approval') {
      return (
        <View style={styles.botRow}>
          <Text style={styles.approvalHint}>{item.preamble}</Text>
          <Text style={styles.approvalHint}>
            {item.candidates.length} sources — confirm in the sheet below.
          </Text>
        </View>
      );
    }
    return <ChatMessage content={item.content} role={item.role} />;
  };

  const ListEmptyComponent = () => (
    <View style={[styles.logoContainer, { marginTop: height - 100 || 100 }]}>
      <Image source={require('@assets/images/logo-white.png')} style={styles.image} />
    </View>
  );

  return (
    <View style={styles.pageContainer}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 4 : 0}
        >
          <View style={styles.header}>
            <TouchableOpacity style={styles.headerBtn}>
              <FontAwesome6 name="grip-lines" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerTitleContainer} onPress={toggleModel}>
              <Text style={styles.headerTitle}>Assistant</Text>
              <Text style={styles.headerSubTitle}>
                {modelChoice === 'qwen-amd' ? 'Qwen (AMD)' : 'Gemma (FW)'} · {modeLabel} {'>'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerBtn} onPress={() => void refreshMode()}>
              <Ionicons name="create-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.page} onLayout={onLayout}>
            {/* @ts-ignore */}
            <FlashList
              ref={flashListRef}
              data={messages}
              renderItem={renderItem}
              estimatedItemSize={120}
              ListEmptyComponent={ListEmptyComponent}
              contentContainerStyle={styles.listContent}
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
              ListFooterComponent={
                loading ? (
                  <View style={styles.footerLoading}>
                    <ActivityIndicator color="#20AB6E" />
                    {loadingSlowHint && modelChoice === 'gemma-fireworks' ? (
                      <Text style={styles.loadingHint}>
                        Starting Gemma — cold GPU can take up to 3 minutes. Keep
                        the app open.
                      </Text>
                    ) : null}
                  </View>
                ) : null
              }
              onContentSizeChange={() => {
                if (messages.length > 0) {
                  flashListRef.current?.scrollToEnd({ animated: true });
                }
              }}
            />
          </View>

          {messages.length === 0 && (
            <MessageIdeas onSelectCard={(text) => handleSendMessage(text)} />
          )}
          <MessageInput onShouldSend={(text) => handleSendMessage(text)} />
        </KeyboardAvoidingView>
      </SafeAreaView>

      {approval && assistantMode === 'hitl' ? (
        <SourceApprovalSheet
          visible
          preamble={approval.preamble}
          candidates={approval.candidates}
          onConfirm={handleConfirmApproval}
          onCancel={() => setApproval(null)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerSubTitle: {
    color: '#888',
    fontSize: 12,
  },
  page: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 16,
  },
  keyboardAvoidingView: {
    flex: 1,
    backgroundColor: '#000',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 80,
    height: 80,
    opacity: 0.3,
  },
  botRow: {
    paddingHorizontal: 14,
    marginVertical: 8,
  },
  approvalHint: {
    color: '#ccc',
    marginBottom: 4,
  },
  footerLoading: {
    padding: 16,
    alignItems: 'flex-start',
    paddingLeft: 48,
    gap: 8,
  },
  loadingHint: {
    color: '#888',
    fontSize: 13,
    maxWidth: 280,
  },
});
