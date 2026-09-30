import { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import type { Mermaid } from 'mermaid';
import MarkdownCodeBlock from '@/components/MarkdownCodeBlock';

interface MermaidDiagramProps {
  source: string;
}

type RenderState = 'loading' | 'ready' | 'error';

let mermaidModulePromise: Promise<typeof import('mermaid')> | null = null;
let mermaidInitializationPromise: Promise<Mermaid> | null = null;

function getMermaidModule() {
  mermaidModulePromise ??= import('mermaid');
  return mermaidModulePromise;
}

async function getConfiguredMermaid(): Promise<Mermaid> {
  const { default: mermaid } = await getMermaidModule();

  mermaidInitializationPromise ??= Promise.resolve().then(() => {
    const themeColor = (name: string, fallback: string) =>
      getComputedStyle(document.documentElement)
        .getPropertyValue(name)
        .trim() || fallback;
    const colors = {
      background: themeColor('--reading-surface', '#222222'),
      component: themeColor('--component-surface', '#303030'),
      foreground: themeColor('--text-ink', '#f2f2f0'),
      muted: themeColor('--text-muted', '#b8b8b5'),
      border: themeColor('--border-color', '#858582'),
      accent: themeColor('--accent-color', '#e1e1dd'),
    };
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      suppressErrorRendering: true,
      htmlLabels: false,
      fontFamily: '"Source Serif 4", "Source Han Serif SC", Georgia, serif',
      fontSize: 14,
      theme: 'base',
      secure: [
        'secure',
        'securityLevel',
        'startOnLoad',
        'maxTextSize',
        'suppressErrorRendering',
        'maxEdges',
        'theme',
        'themeVariables',
        'fontFamily',
        'fontSize',
        'htmlLabels',
      ],
      themeVariables: {
        background: colors.background,
        primaryColor: colors.component,
        primaryTextColor: colors.foreground,
        primaryBorderColor: colors.border,
        lineColor: colors.accent,
        secondaryColor: colors.background,
        secondaryTextColor: colors.foreground,
        secondaryBorderColor: colors.border,
        tertiaryColor: colors.component,
        tertiaryTextColor: colors.muted,
        tertiaryBorderColor: colors.border,
        textColor: colors.foreground,
        mainBkg: colors.component,
        nodeTextColor: colors.foreground,
        nodeBorder: colors.border,
        clusterBkg: colors.background,
        clusterBorder: colors.border,
        defaultLinkColor: colors.accent,
        edgeLabelBackground: colors.background,
        noteBkgColor: colors.component,
        noteTextColor: colors.foreground,
        noteBorderColor: colors.border,
        titleColor: colors.foreground,
        actorBkg: colors.component,
        actorBorder: colors.border,
        actorTextColor: colors.foreground,
        signalColor: colors.accent,
        signalTextColor: colors.foreground,
      },
    });

    return mermaid;
  });

  return mermaidInitializationPromise;
}

export default function MermaidDiagram({ source }: MermaidDiagramProps) {
  const { t } = useTranslation();
  const id = useId().replace(/:/g, '');
  const [svg, setSvg] = useState('');
  const [renderState, setRenderState] = useState<RenderState>('loading');

  useEffect(() => {
    let isCurrentRender = true;

    setSvg('');
    setRenderState('loading');

    const renderDiagram = async () => {
      try {
        if (document.fonts?.ready) {
          await document.fonts.ready;
        }

        const mermaid = await getConfiguredMermaid();
        const renderId = `mermaid-${id}-${Date.now()}`;
        const result = await mermaid.render(renderId, source);

        if (!isCurrentRender) {
          return;
        }

        setSvg(result.svg);
        setRenderState('ready');
      } catch {
        if (isCurrentRender) {
          setRenderState('error');
        }
      }
    };

    void renderDiagram();

    return () => {
      isCurrentRender = false;
    };
  }, [id, source]);

  const diagramLabel = t('labels.mermaidDiagram');
  const zoomInLabel = t('actions.zoomIn');
  const zoomOutLabel = t('actions.zoomOut');
  const resetLabel = t('actions.resetDiagram');

  return (
    <figure className="mermaid-frame" aria-label={diagramLabel}>
      {renderState === 'ready' ? (
        <TransformWrapper
          initialScale={1}
          minScale={1}
          maxScale={3}
          centerOnInit
          limitToBounds
          wheel={{ disabled: false }}
          doubleClick={{ disabled: true }}
          panning={{ velocityDisabled: true, allowLeftClickPan: true }}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              <div
                className="mermaid-controls"
                role="toolbar"
                aria-label={diagramLabel}
              >
                <button
                  className="mermaid-control-button"
                  type="button"
                  onClick={() => zoomOut()}
                  aria-label={zoomOutLabel}
                  title={zoomOutLabel}
                >
                  −
                </button>
                <button
                  className="mermaid-control-button"
                  type="button"
                  onClick={() => zoomIn()}
                  aria-label={zoomInLabel}
                  title={zoomInLabel}
                >
                  +
                </button>
                <button
                  className="mermaid-control-button mermaid-control-reset"
                  type="button"
                  onClick={() => resetTransform()}
                  aria-label={resetLabel}
                  title={resetLabel}
                >
                  ↺
                </button>
              </div>
              <TransformComponent
                wrapperClass="mermaid-viewport"
                contentClass="mermaid-content"
                wrapperStyle={{
                  width: '100%',
                  height: 'clamp(18rem, 40vw, 30rem)',
                }}
                contentStyle={{
                  width: '100%',
                  minWidth: '100%',
                  minHeight: '100%',
                }}
              >
                <div dangerouslySetInnerHTML={{ __html: svg }} />
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      ) : renderState === 'error' ? (
        <>
          <p className="mermaid-status mermaid-status-error" role="alert">
            {t('labels.mermaidRenderError')}
          </p>
          <MarkdownCodeBlock>{source}</MarkdownCodeBlock>
        </>
      ) : (
        <p className="mermaid-status" role="status" aria-live="polite">
          {t('labels.renderingDiagram')}
        </p>
      )}
    </figure>
  );
}
