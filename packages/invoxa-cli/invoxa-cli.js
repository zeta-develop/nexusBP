#!/usr/bin/env node

const { Command } = require('commander');
const program = new Command();

program
  .name('@zeta-develop/invoxa-cli')
  .description('CLI for managing InvoXa modules and other operations')
  .version('0.0.1');

program
  .command('install:<module_name>')
  .description('Installs a specified module (e.g., pterodactyl)')
  .action((module_name_with_command) => {
    // The argument will be 'install:module_name', so we need to parse the actual module name
    const parts = module_name_with_command.split(':');
    if (parts.length < 2 || parts[0] !== 'install') {
        console.error('Invalid command format. Use install:<module_name>');
        process.exit(1);
    }
    const moduleName = parts.slice(1).join(':'); // Handle cases where module name might have colons

    console.log(`Attempting to install module: ${moduleName}...`);
    // In a real CLI, you would add logic here to:
    // 1. Validate the module name
    // 2. Check if the module exists in a registry or repository
    // 3. Download the module files
    // 4. Run any installation scripts for the module
    // 5. Update configuration or database as needed
    console.log(`Simulated installation of '${moduleName}' module completed.`);
    console.log('This CLI is a basic placeholder. Actual installation logic needs to be implemented.');
  });

program.parse(process.argv);

// If no command is matched, Commander.js by default shows help.
// If you want to show help for invalid commands as well:
if (!process.argv.slice(2).length) {
  // program.outputHelp(); // Already handled by Commander
} else if (program.args.length === 0 && process.argv.slice(2).length > 0 && !program.commands.find(cmd => cmd.name().startsWith(process.argv.slice(2)[0].split(':')[0]))) {
    // Check if it's not a known command starting pattern
    // This logic might need refinement for complex command structures
    console.log(`Error: Unknown command '${process.argv.slice(2).join(' ')}'.`);
    program.outputHelp();
    process.exit(1);
}
