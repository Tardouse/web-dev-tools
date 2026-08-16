"use client";

import { useEffect, useRef, useState } from "react";
import { CircleAlert, Download, KeyRound, ShieldCheck } from "lucide-react";
import { downloadText } from "@/lib/clipboard";
import {
  type EcdsaKeySize,
  type GeneratedSshKey,
  type RsaKeySize,
  type SshKeyAlgorithm,
} from "@/lib/tools";
import type { ToolComponentProps } from "@/lib/types";
import { localizeToolError } from "@/i18n/errors";
import { isToolTaskCancellation, runToolWorker } from "@/lib/tool-execution";
import { ActionButton, CopyButton } from "./tool-actions";

export function SshKeyGeneratorTool({
  definition,
  locale,
  messages,
}: ToolComponentProps) {
  const zh = locale === "zh";
  const [algorithm, setAlgorithm] = useState<SshKeyAlgorithm>("ED25519");
  const [rsaSize, setRsaSize] = useState<RsaKeySize>(3072);
  const [ecdsaSize, setEcdsaSize] = useState<EcdsaKeySize>(256);
  const [comment, setComment] = useState("developer@example.com");
  const [passphrase, setPassphrase] = useState("");
  const [result, setResult] = useState<GeneratedSshKey | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const execution = useRef<AbortController | null>(null);
  useEffect(() => () => execution.current?.abort(), []);
  const generate = async () => {
    execution.current?.abort();
    const controller = new AbortController();
    execution.current = controller;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const generated = await runToolWorker<GeneratedSshKey>(
        {
          operation: "ssh-key",
          options: {
            algorithm,
            size: algorithm === "RSA" ? rsaSize : ecdsaSize,
            comment,
            passphrase:
              algorithm === "ED25519" ? undefined : passphrase || undefined,
          },
        },
        definition,
        controller.signal,
      );
      if (!controller.signal.aborted) setResult(generated);
    } catch (caught) {
      if (isToolTaskCancellation(caught)) return;
      setError(
        caught instanceof Error
          ? localizeToolError(caught.message, messages)
          : "SSH key generation failed.",
      );
    } finally {
      if (execution.current === controller) {
        execution.current = null;
        setBusy(false);
      }
    }
  };
  const basename =
    algorithm === "ED25519"
      ? "id_ed25519"
      : algorithm === "RSA"
        ? "id_rsa"
        : "id_ecdsa";
  return (
    <section className="tool-workspace card ssh-tool">
      <div className="workspace-header">
        <h2>{zh ? "SSH 密钥生成器" : "SSH key generator"}</h2>
        <div className="segmented">
          {(["ED25519", "RSA", "ECDSA"] as const).map((item) => (
            <button
              key={item}
              aria-pressed={algorithm === item}
              onClick={() => {
                setAlgorithm(item);
                setResult(null);
              }}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="security-notice">
        <ShieldCheck size={20} />
        <div>
          <strong>
            {zh
              ? "私钥只在当前浏览器中生成"
              : "Your private key is generated locally"}
          </strong>
          <span>
            {zh
              ? "私钥不会上传到服务器，也不会保存在本站。"
              : "It is never uploaded to the server or stored by this site."}
          </span>
        </div>
      </div>
      {error && (
        <div className="error-banner" role="alert">
          <CircleAlert size={17} />
          {error}
        </div>
      )}
      <div className="ssh-options">
        {algorithm !== "ED25519" && (
          <label className="field">
            <span>{zh ? "密钥长度" : "Key size"}</span>
            <select
              aria-label={zh ? "密钥长度" : "Key size"}
              value={algorithm === "RSA" ? rsaSize : ecdsaSize}
              onChange={(event) =>
                algorithm === "RSA"
                  ? setRsaSize(Number(event.target.value) as RsaKeySize)
                  : setEcdsaSize(Number(event.target.value) as EcdsaKeySize)
              }
            >
              {(algorithm === "RSA" ? [2048, 3072, 4096] : [256, 384, 521]).map(
                (size) => (
                  <option key={size} value={size}>
                    {size} bit
                    {size === 3072 && algorithm === "RSA"
                      ? zh
                        ? "（推荐）"
                        : " (recommended)"
                      : ""}
                  </option>
                ),
              )}
            </select>
          </label>
        )}
        <label className="field">
          <span>{zh ? "注释" : "Comment"}</span>
          <input
            aria-label={zh ? "密钥注释" : "Key comment"}
            value={comment}
            maxLength={128}
            onChange={(event) => setComment(event.target.value)}
          />
        </label>
        <label className="field">
          <span>{zh ? "口令（可选）" : "Passphrase (optional)"}</span>
          <input
            aria-label={zh ? "私钥口令" : "Private key passphrase"}
            type="password"
            value={algorithm === "ED25519" ? "" : passphrase}
            disabled={algorithm === "ED25519"}
            minLength={8}
            placeholder={
              algorithm === "ED25519"
                ? zh
                  ? "Ed25519 暂不支持"
                  : "Unavailable for Ed25519"
                : zh
                  ? "至少 8 位"
                  : "At least 8 characters"
            }
            onChange={(event) => setPassphrase(event.target.value)}
          />
        </label>
        <ActionButton
          icon={KeyRound}
          primary
          disabled={busy}
          onClick={() => void generate()}
        >
          {busy
            ? zh
              ? "正在生成…"
              : "Generating…"
            : zh
              ? "生成新密钥"
              : "Generate new key"}
        </ActionButton>
      </div>
      {result ? (
        <div className="ssh-results">
          <div className="ssh-summary">
            <span>
              {result.algorithm} · {result.bits} bit
            </span>
            <code>{result.fingerprint}</code>
            <span>
              {zh ? "私钥格式" : "Private format"}: {result.privateFormat}
            </span>
          </div>
          <div className="ssh-key-panel">
            <div className="panel-label">
              <span>{zh ? "公钥（OpenSSH）" : "Public key (OpenSSH)"}</span>
              <div>
                <CopyButton messages={messages} value={result.publicKey} />
                <ActionButton
                  icon={Download}
                  onClick={() =>
                    downloadText(`${result.publicKey}\n`, `${basename}.pub`)
                  }
                >
                  {zh ? "下载" : "Download"}
                </ActionButton>
              </div>
            </div>
            <textarea
              readOnly
              aria-label={zh ? "OpenSSH 公钥" : "OpenSSH public key"}
              value={result.publicKey}
            />
          </div>
          <div className="ssh-key-panel private">
            <div className="panel-label">
              <span>
                {zh
                  ? `私钥（${result.privateFormat}）`
                  : `Private key (${result.privateFormat})`}
              </span>
              <div>
                <CopyButton messages={messages} value={result.privateKey} />
                <ActionButton
                  icon={Download}
                  onClick={() => downloadText(result.privateKey, basename)}
                >
                  {zh ? "下载" : "Download"}
                </ActionButton>
              </div>
            </div>
            <textarea
              readOnly
              spellCheck={false}
              aria-label={zh ? "私钥" : "Private key"}
              value={result.privateKey}
            />
          </div>
        </div>
      ) : (
        <div className="empty-state ssh-empty">
          <KeyRound size={28} />
          <strong>{zh ? "尚未生成密钥" : "No key generated"}</strong>
          <span>
            {zh
              ? "每次生成都会创建一套全新的随机密钥。"
              : "Every run creates a fresh random key pair."}
          </span>
        </div>
      )}
    </section>
  );
}
