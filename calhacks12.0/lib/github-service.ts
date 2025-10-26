interface GitHubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size?: number;
  content?: string;
  encoding?: string;
  sha: string;
  url: string;
  download_url?: string;
}

interface RepositoryStructure {
  files: GitHubFile[];
  languages: Record<string, number>;
  readme?: string;
  packageJson?: any;
  totalFiles: number;
  importantFiles: GitHubFile[];
}

interface CodeAnalysis {
  structure: RepositoryStructure;
  patterns: {
    imports: string[];
    exports: string[];
    functions: Array<{
      name: string;
      file: string;
      line: number;
    }>;
    classes: Array<{
      name: string;
      file: string;
      line: number;
    }>;
    dependencies: string[];
    scripts: Record<string, string>;
  };
  metrics: {
    totalLines: number;
    averageFileSize: number;
    complexity: 'low' | 'medium' | 'high';
    testCoverage: number;
  };
}

export class GitHubService {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async makeGitHubRequest(url: string): Promise<any> {
    console.log(`🌐 GitHub API: Making request to ${url}`);
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "GitLit",
      },
    });

    console.log(`📊 GitHub API: Response status ${response.status} for ${url}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ GitHub API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    console.log(`✅ GitHub API: Request successful for ${url}`);
    return response.json();
  }

  async getRepositoryStructure(owner: string, repo: string): Promise<RepositoryStructure> {
    console.log(`🔍 GitHub Service: Fetching repository structure for ${owner}/${repo}`);
    
    try {
      // Get repository languages
      console.log('🌐 Fetching repository languages...');
      const languages = await this.makeGitHubRequest(
        `https://api.github.com/repos/${owner}/${repo}/languages`
      );
      console.log('✅ Languages fetched:', Object.keys(languages));

      // Get repository tree (file structure)
      console.log('📁 Fetching repository tree...');
      const treeResponse = await this.makeGitHubRequest(
        `https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`
      );
      console.log('✅ Repository tree fetched, processing files...');

      const allFiles = treeResponse.tree
        .filter((item: any) => item.type === 'blob')
        .map((item: any) => ({
          name: item.path.split('/').pop(),
          path: item.path,
          type: 'file' as const,
          size: item.size,
          sha: item.sha,
          url: item.url,
        }));

      // Filter important files
      console.log(`🔍 Filtering important files from ${allFiles.length} total files...`);
      const importantFiles = this.filterImportantFiles(allFiles);
      console.log(`✅ Found ${importantFiles.length} important files`);

      // Get README content
      console.log('📖 Looking for README file...');
      let readme: string | undefined;
      try {
        const readmeFile = allFiles.find(file => 
          file.name.toLowerCase().includes('readme') && 
          (file.name.endsWith('.md') || file.name.endsWith('.txt'))
        );
        if (readmeFile) {
          console.log(`📖 Found README: ${readmeFile.path}`);
          const readmeContent = await this.getFileContent(owner, repo, readmeFile.path);
          readme = readmeContent;
          console.log('✅ README content fetched');
        } else {
          console.log('❌ No README file found');
        }
      } catch (error) {
        console.log('❌ Error reading README:', error);
      }

      // Get package.json
      console.log('📦 Looking for package.json...');
      let packageJson: any;
      try {
        const packageJsonFile = allFiles.find(file => file.name === 'package.json');
        if (packageJsonFile) {
          console.log(`📦 Found package.json: ${packageJsonFile.path}`);
          const packageJsonContent = await this.getFileContent(owner, repo, packageJsonFile.path);
          packageJson = JSON.parse(packageJsonContent);
          console.log('✅ package.json content fetched');
        } else {
          console.log('❌ No package.json found');
        }
      } catch (error) {
        console.log('❌ Error reading package.json:', error);
      }

      return {
        files: allFiles,
        languages,
        readme,
        packageJson,
        totalFiles: allFiles.length,
        importantFiles,
      };
    } catch (error) {
      console.error('Error fetching repository structure:', error);
      throw error;
    }
  }

  async getFileContent(owner: string, repo: string, path: string): Promise<string> {
    try {
      const fileData = await this.makeGitHubRequest(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}`
      );

      if (fileData.encoding === 'base64') {
        return Buffer.from(fileData.content, 'base64').toString('utf-8');
      }
      return fileData.content;
    } catch (error) {
      console.error(`Error fetching file content for ${path}:`, error);
      throw error;
    }
  }

  private filterImportantFiles(files: GitHubFile[]): GitHubFile[] {
    const importantPatterns = [
      // Configuration files
      /package\.json$/i,
      /tsconfig\.json$/i,
      /next\.config\.(js|ts|mjs)$/i,
      /tailwind\.config\.(js|ts)$/i,
      /eslint\.config\.(js|ts|mjs)$/i,
      /\.env\.example$/i,
      /dockerfile$/i,
      /docker-compose\.yml$/i,
      
      // Source code files
      /\.(ts|tsx|js|jsx)$/i,
      /\.(py|java|cpp|c|cs|go|rs|php|rb)$/i,
      
      // Documentation
      /readme\.(md|txt)$/i,
      /changelog\.(md|txt)$/i,
      /contributing\.(md|txt)$/i,
      /license$/i,
      
      // Test files
      /\.(test|spec)\.(ts|tsx|js|jsx)$/i,
      /__tests__/i,
      
      // Styles
      /\.(css|scss|sass|less)$/i,
      
      // Other important files
      /\.gitignore$/i,
      /\.github\//i,
    ];

    return files.filter(file => 
      importantPatterns.some(pattern => pattern.test(file.path)) &&
      file.size && file.size < 100000 // Limit file size to 100KB
    );
  }

  async analyzeCodePatterns(owner: string, repo: string, structure: RepositoryStructure): Promise<CodeAnalysis> {
    const patterns = {
      imports: [] as string[],
      exports: [] as string[],
      functions: [] as Array<{ name: string; file: string; line: number }>,
      classes: [] as Array<{ name: string; file: string; line: number }>,
      dependencies: [] as string[],
      scripts: {} as Record<string, string>,
    };

    let totalLines = 0;
    let totalFiles = 0;

    // Analyze package.json
    if (structure.packageJson) {
      patterns.dependencies = Object.keys(structure.packageJson.dependencies || {});
      patterns.scripts = structure.packageJson.scripts || {};
    }

    // Analyze important files
    for (const file of structure.importantFiles.slice(0, 10)) { // Limit to first 10 files
      try {
        const content = await this.getFileContent(owner, repo, file.path);
        const lines = content.split('\n');
        totalLines += lines.length;
        totalFiles++;

        // Extract patterns based on file type
        if (file.name.endsWith('.ts') || file.name.endsWith('.tsx') || 
            file.name.endsWith('.js') || file.name.endsWith('.jsx')) {
          this.extractJavaScriptPatterns(content, file.path, patterns);
        } else if (file.name.endsWith('.py')) {
          this.extractPythonPatterns(content, file.path, patterns);
        }
      } catch (error) {
        console.log(`Skipping file ${file.path} due to error:`, error);
      }
    }

    // Calculate metrics
    const averageFileSize = totalFiles > 0 ? totalLines / totalFiles : 0;
    const complexity = this.calculateComplexity(patterns, totalLines);
    const testCoverage = this.calculateTestCoverage(structure);

    return {
      structure,
      patterns,
      metrics: {
        totalLines,
        averageFileSize,
        complexity,
        testCoverage,
      },
    };
  }

  private extractJavaScriptPatterns(content: string, filePath: string, patterns: any) {
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Extract imports
      const importMatch = line.match(/import\s+.*\s+from\s+['"]([^'"]+)['"]/);
      if (importMatch) {
        patterns.imports.push(importMatch[1]);
      }

      // Extract exports
      const exportMatch = line.match(/export\s+(?:default\s+)?(?:function|class|const|let|var)\s+(\w+)/);
      if (exportMatch) {
        patterns.exports.push(exportMatch[1]);
      }

      // Extract functions
      const functionMatch = line.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)/);
      if (functionMatch) {
        patterns.functions.push({
          name: functionMatch[1],
          file: filePath,
          line: index + 1,
        });
      }

      // Extract classes
      const classMatch = line.match(/(?:export\s+)?class\s+(\w+)/);
      if (classMatch) {
        patterns.classes.push({
          name: classMatch[1],
          file: filePath,
          line: index + 1,
        });
      }
    });
  }

  private extractPythonPatterns(content: string, filePath: string, patterns: any) {
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Extract imports
      const importMatch = line.match(/import\s+(\w+)|from\s+(\w+)\s+import/);
      if (importMatch) {
        patterns.imports.push(importMatch[1] || importMatch[2]);
      }

      // Extract functions
      const functionMatch = line.match(/def\s+(\w+)/);
      if (functionMatch) {
        patterns.functions.push({
          name: functionMatch[1],
          file: filePath,
          line: index + 1,
        });
      }

      // Extract classes
      const classMatch = line.match(/class\s+(\w+)/);
      if (classMatch) {
        patterns.classes.push({
          name: classMatch[1],
          file: filePath,
          line: index + 1,
        });
      }
    });
  }

  private calculateComplexity(patterns: any, totalLines: number): 'low' | 'medium' | 'high' {
    const functionCount = patterns.functions.length;
    const classCount = patterns.classes.length;
    const importCount = patterns.imports.length;
    
    const complexityScore = (functionCount * 2) + (classCount * 3) + (importCount * 0.5) + (totalLines * 0.01);
    
    if (complexityScore < 50) return 'low';
    if (complexityScore < 150) return 'medium';
    return 'high';
  }

  private calculateTestCoverage(structure: RepositoryStructure): number {
    const testFiles = structure.files.filter(file => 
      file.name.includes('test') || 
      file.name.includes('spec') || 
      file.path.includes('__tests__')
    ).length;
    
    const totalSourceFiles = structure.files.filter(file => 
      /\.(ts|tsx|js|jsx|py|java|cpp|c|cs|go|rs|php|rb)$/i.test(file.name)
    ).length;
    
    return totalSourceFiles > 0 ? (testFiles / totalSourceFiles) * 100 : 0;
  }
}
