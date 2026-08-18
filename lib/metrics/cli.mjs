import { buildReducedModel } from './model.mjs';
import { resolvePlanIdentity } from './paths.mjs';
import { renderJson } from './render-json.mjs';
import { renderMarkdown } from './render-markdown.mjs';
import { renderTerminal } from './render-terminal.mjs';
import { reduceRun } from './reducer.mjs';
import { applyRetention, listRuns, selectRun, writeReport } from './store.mjs';

const usage = `Usage: superpowers metrics <plan-path> [--run ID] [--json] [--write]\n`;

function parseMetricsArguments(argv) {
  if (argv.length === 1 && argv[0] === '--help') return { help: true };
  if (argv[0] !== 'metrics') throw new Error('Expected metrics command');
  if (argv.length === 2 && argv[1] === '--help') return { help: true };
  if (typeof argv[1] !== 'string' || argv[1].startsWith('-')) throw new Error('Plan path is required');

  const options = { planPath: argv[1], runId: null, json: false, write: false };
  const seen = new Set();
  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--run') {
      if (seen.has(arg)) throw new Error('--run may be supplied only once');
      const runId = argv[index + 1];
      if (typeof runId !== 'string' || runId.startsWith('-')) throw new Error('--run requires an ID');
      seen.add(arg);
      options.runId = runId;
      index += 1;
    } else if (arg === '--json' || arg === '--write') {
      if (seen.has(arg)) throw new Error(`${arg} may be supplied only once`);
      seen.add(arg);
      options[arg.slice(2)] = true;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  return options;
}

const write = (stream, text) => stream.write(text);

export async function runCli(argv, io) {
  const { cwd = process.cwd(), stdout = process.stdout, stderr = process.stderr } = io ?? {};
  let options;
  try {
    options = parseMetricsArguments(argv);
    if (options.help) {
      write(stdout, usage);
      return 0;
    }

    const identity = resolvePlanIdentity(options.planPath, { cwd });
    const runs = listRuns(identity);
    const selected = selectRun(runs, options.runId);
    const latest = selectRun(runs, null);
    if (options.write && selected.metadata.run_id !== latest.metadata.run_id) {
      throw new Error('--write is allowed only for the latest run');
    }

    const reduction = reduceRun(selected.metadata, selected.eventLines);
    const model = buildReducedModel(reduction, { currentPlanFingerprint: identity.currentFingerprint });
    // CLI wording distinguishes changed on-disk plan from general model comparisons.
    model.warnings = model.warnings.map(warning => warning.code === 'PLAN_FINGERPRINT_MISMATCH'
      ? { ...warning, code: 'PLAN_FINGERPRINT_CHANGED' }
      : warning);
    if (options.write) {
      try {
        writeReport(identity, renderMarkdown(model));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to write report ${identity.reportPath}: ${message}`);
      }
      const classifiedRuns = runs.map(run => {
        try {
          const runReduction = run === selected ? reduction : reduceRun(run.metadata, run.eventLines);
          const runModel = run === selected ? model : buildReducedModel(runReduction, {
            currentPlanFingerprint: identity.currentFingerprint,
          });
          return { run, model: runModel, diagnostics: runReduction.diagnostics };
        } catch {
          return { run, model: null };
        }
      });
      const retention = applyRetention(identity, classifiedRuns);
      for (const diagnostic of retention.diagnostics) {
        write(stderr, `superpowers metrics: retention ${diagnostic.code} ${diagnostic.run_id}: ${diagnostic.message}\n`);
      }
    }
    write(stdout, options.json ? renderJson(model) : renderTerminal(model));
    return model.outcome === 'INCOMPLETE' ? 1 : 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    write(stderr, `superpowers metrics: ${message}\n`);
    return 2;
  }
}
