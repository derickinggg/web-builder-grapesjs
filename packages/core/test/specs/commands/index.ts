import Commands from '../../../src/commands';
import EditorModel from '../../../src/editor/model/Editor';
import { Command, CommandFunction } from '../../../src/commands/view/CommandAbstract';

describe('Commands', () => {
  describe('Main', () => {
    let em: EditorModel;
    let obj: Commands;
    let commSimple: Command;
    let commRunOnly: Command;
    let commFunc: CommandFunction;
    let commName = 'commandTest';
    let commResultRun = 'Run executed';
    let commResultStop = 'Stop executed';

    beforeEach(() => {
      commSimple = {
        run: () => commResultRun,
        stop: () => commResultStop,
      };
      commRunOnly = {
        run: () => commResultRun,
      };
      commFunc = () => commResultRun;
      em = new EditorModel();
      em.set('Editor', em);
      obj = em.Commands;
    });

    afterEach(() => {
      em.destroy();
    });

    test('No commands inside', () => {
      expect(obj.get('test')).toBeUndefined();
    });

    test('Push new command', () => {
      const comm = { test: 'test' };
      const len = Object.keys(obj.getAll()).length;
      obj.add('test', comm);
      expect(obj.has('test')).toBe(true);
      expect(Object.keys(obj.getAll()).length).toBe(len + 1);
      expect(obj.get('test')!.test).toEqual('test');
    });

    test('Default commands after loadDefaultCommands', () => {
      expect(obj.get('select-comp')).not.toBeUndefined();
    });

    test('Commands module should not have toLoad property', () => {
      // @ts-ignore
      expect(obj.toLoad).toBeUndefined();
    });

    test('Run simple command and check if the state is tracked', () => {
      // Add the command
      obj.add(commName, commSimple);
      expect(obj.isActive(commName)).toBe(false);

      // Start the command
      let result = obj.run(commName);
      expect(result).toBe(commResultRun);
      expect(obj.isActive(commName)).toBe(true);
      expect(Object.keys(obj.getActive()).length).toBe(1);

      // Stop the command
      result = obj.stop(commName);
      expect(result).toBe(commResultStop);
      expect(obj.isActive(commName)).toBe(false);
      expect(Object.keys(obj.getActive()).length).toBe(0);
    });

    test('Run command only with run method, ensure is not tracked', () => {
      // Add the command
      obj.add(commName, commRunOnly);
      expect(obj.isActive(commName)).toBe(false);

      // Start the command
      let result = obj.run(commName);
      expect(result).toBe(commResultRun);
      expect(obj.isActive(commName)).toBe(false);
      expect(Object.keys(obj.getActive()).length).toBe(0);
    });

    test('Run function command, ensure is not tracked', () => {
      // Add the command
      obj.add(commName, commFunc);
      expect(obj.isActive(commName)).toBe(false);

      // Start the command
      let result = obj.run(commName);
      expect(result).toBe(commResultRun);
      expect(obj.isActive(commName)).toBe(false);
      expect(Object.keys(obj.getActive()).length).toBe(0);
    });

    test('Run command with and without default options', () => {
      const defaultOptions = { test: 'default' };
      const options = { test: 'custom' };
      const command = { run: jest.fn(), stop: jest.fn() };
      obj.add(commName, command);
      em.config.commands = {
        defaultOptions: {
          [commName]: {
            run: (opts) => ({ ...opts, ...defaultOptions }),
          },
        },
      };

      // Test run command with default options
      obj.run(commName, options);
      expect(command.run).toHaveBeenCalledWith(expect.anything(), expect.objectContaining(defaultOptions));

      // Test run command without default options
      em.config.commands.defaultOptions![commName].run = undefined;
      obj.run(commName, options);
      expect(command.run).toHaveBeenCalledWith(expect.anything(), expect.objectContaining(options));
    });

    test('Stop command with and without default options', () => {
      const defaultOptions = { test: 'default' };
      const options = { test: 'custom' };
      const command = { run: jest.fn(), stop: jest.fn() };
      obj.add(commName, command);
      em.config.commands = {
        defaultOptions: {
          [commName]: {
            stop: (opts) => ({ ...opts, ...defaultOptions }),
          },
        },
      };

      // Test stop command with default options
      obj.run(commName, options);
      obj.stop(commName, options);
      expect(command.stop).toHaveBeenCalledWith(em, expect.objectContaining(defaultOptions));

      // Test stop command without default options
      em.config.commands.defaultOptions![commName].stop = undefined;
      obj.stop(commName, options);
      expect(command.stop).toHaveBeenCalledWith(em, expect.objectContaining(options));
    });
  });
});
