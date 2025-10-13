// auth.js — Sistema de Autenticação (Supabase Auth em Produção)

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.supabase = supabase; // instância global já configurada
    }

    async init() {
        try {
            // Tenta restaurar sessão persistente
            const { data: { session } } = await this.supabase.auth.getSession();

            if (session?.user) {
                this.currentUser = session.user;
                await this.syncUserWithSupabase();
            }

            // Listener para login/logout automático
            this.supabase.auth.onAuthStateChange(async (event, session) => {
                if (session?.user) {
                    this.currentUser = session.user;
                    await this.syncUserWithSupabase();
                } else {
                    this.currentUser = null;
                    localStorage.removeItem('yumeUser');
                }
            });
        } catch (error) {
            console.error('Erro ao inicializar autenticação:', error);
        }
    }

    async register(name, email, password, acceptedTerms) {
        if (!acceptedTerms) throw new Error('Você precisa aceitar os Termos de Uso.');
        if (!name || !email || !password) throw new Error('Preencha todos os campos.');
        if (password.length < 8) throw new Error('A senha deve ter no mínimo 8 caracteres.');

        const { data, error } = await this.supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name },
                emailRedirectTo: `${window.location.origin}/`
            }
        });

        if (error) throw error;
        this.currentUser = data.user;
        await this.syncUserWithSupabase();
        localStorage.setItem('yumeUser', JSON.stringify(this.currentUser));
        return this.currentUser;
    }

    async login(email, password) {
        if (!email || !password) throw new Error('Preencha todos os campos.');

        const { data, error } = await this.supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;
        this.currentUser = data.user;
        await this.syncUserWithSupabase();
        localStorage.setItem('yumeUser', JSON.stringify(this.currentUser));
        return this.currentUser;
    }

    async loginWithProvider(provider) {
        // Ex: 'google', 'github', 'discord'
        const { error } = await this.supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: window.location.origin
            }
        });

        if (error) throw error;
    }

    async logout() {
        await this.supabase.auth.signOut();
        this.currentUser = null;
        localStorage.removeItem('yumeUser');
        localStorage.removeItem('yumePreferences');
        localStorage.removeItem('yumeAvatar');
    }

    async syncUserWithSupabase() {
        if (!this.currentUser?.email) return;

        try {
            const { data: existingUser, error: selectError } = await this.supabase
                .from('users')
                .select('*')
                .eq('email', this.currentUser.email)
                .single();

            if (selectError && selectError.code === 'PGRST116') {
                // Usuário não existe, criar
                const { data: newUser, error: insertError } = await this.supabase
                    .from('users')
                    .insert([{
                        name: this.currentUser.user_metadata?.name || 'Usuário',
                        email: this.currentUser.email,
                        avatar: localStorage.getItem('yumeAvatar') || 'default',
                        preferences: JSON.parse(localStorage.getItem('yumePreferences') || '[]'),
                        auth_method: this.currentUser.app_metadata?.provider || 'email',
                        created_at: new Date().toISOString()
                    }])
                    .select()
                    .single();

                if (!insertError && newUser) {
                    this.currentUser.id = newUser.id;
                    localStorage.setItem('yumeUser', JSON.stringify(this.currentUser));
                }
            } else if (existingUser) {
                // Atualiza informações locais e marca último login
                this.currentUser.id = existingUser.id;
                localStorage.setItem('yumeUser', JSON.stringify(this.currentUser));
                await this.supabase
                    .from('users')
                    .update({ last_login: new Date().toISOString() })
                    .eq('id', existingUser.id);
            }
        } catch (error) {
            console.error('Erro ao sincronizar com tabela users:', error);
        }
    }

    async updateUserInSupabase(updates) {
        if (!this.currentUser?.id) return;

        try {
            const { error } = await this.supabase
                .from('users')
                .update(updates)
                .eq('id', this.currentUser.id);

            if (error) throw error;
        } catch (error) {
            console.error('Erro ao atualizar usuário:', error);
        }
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }
}

// Instância global
const authManager = new AuthManager();